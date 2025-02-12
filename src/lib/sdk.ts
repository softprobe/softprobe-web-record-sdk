import { record as rrwebRecord } from 'rrweb';
import { recordOptions } from 'rrweb/typings/types';
import { mergeTags } from './utils';

const MAX_EVENTS = 500;
const MAX_RETRY = 3;

export type Tags = {
  userId?: string;
  clientId?: string;
  email?: string;
  phoneNo?: string;
  ext?: Record<string, string>;
};

export interface ManualRecordSdkOptions extends recordOptions<any> {
  tags?: Tags;
}

export interface RecordSdkOptions extends ManualRecordSdkOptions {
  authToken: string; // The JWT token for authentication
  serverUrl?: string; // The URL of the server
  interval?: number; // The interval of the recording
  manual?: boolean; // Whether to manually start the recording
}

interface RetryOptions {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffFactor?: number;
    retryableErrors?: Array<string | RegExp>;
    shouldRetry?: (error: any) => boolean;
}

export default class RecordSdk {
  private events: any[] = [];
  private readonly authToken: string;
  private readonly recordId: string;
  private readonly serverUrl: string;
  private readonly interval: number;
  private readonly recordOptions: recordOptions<any>;
  private tags: Tags;
  private hasNewEvent: boolean = true;

  constructor(options: RecordSdkOptions) {
    const {
      authToken,
      serverUrl = 'https://upload.whateverhome.store',
      interval = 5000,
      manual = false,
      tags = {},
      ...recordOptions
    } = options;

    this.authToken = authToken;
    this.recordId = this.uuid();
    this.serverUrl = serverUrl.startsWith('//')
      ? `${window.location.protocol}${serverUrl}`
      : serverUrl;
    this.interval = Math.max(interval, 5000);
    this.tags = tags;
    this.recordOptions = recordOptions;

    !manual && this.record();

    return this;
  }

  record(recordOptions?: ManualRecordSdkOptions) {
    const { tags = {}, ...options } = recordOptions || {};
    let isSaving = false;

    const emitEvent: recordOptions<any>['emit'] = (event: any) => {
      if (this.events.length >= MAX_EVENTS) {
        this.events.shift(); // remove the oldest event
      }
      this.events.push(event);
      this.hasNewEvent = true;
    };


    const stopFn = rrwebRecord({
      emit: emitEvent,
      ...this.recordOptions,
      ...options
    });

    const reportEvents = () => {
      if (this.events.length > 0 && !isSaving) {
        isSaving = true;
        this.save({ tags }).finally(() => {
          isSaving = false;
        });
      }
    };

    const intervalId = setInterval(reportEvents, this.interval);

    return {
      stop: () => {
        clearInterval(intervalId);
        stopFn?.();
        reportEvents();
      }
    };
  }

  setTags(tags: Tags, override = false) {
    this.tags = override ? tags : { ...this.tags, ...tags };
  }

  private async save(params?: { tags?: Tags }) {
    if (this.events.length === 0 || !this.hasNewEvent) return;

    const body = JSON.stringify({
      events: this.events,
      recordId: this.recordId,
      ...mergeTags(this.tags, params?.tags)
    });

    try {
      await this.retryOperation(async () => {
        const fetchRes = await fetch(this.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            'x-sp-record-id': this.recordId,
            'x-sp-tags': JSON.stringify(this.tags),
          },
          body,
          redirect: 'follow'
        });

        if (!fetchRes.ok) {
          throw new Error(`HTTP error! Status Code: ${fetchRes.status}. Details: ${await fetchRes.text()}`);
        }

        this.hasNewEvent = false;
      });

    } catch (error) {
      console.error('All retry attempts failed:', error);
      console.error('Events will be retained for next attempt.');
    }
  }

  private async retryOperation<T>(
    operation: () => Promise<T>,
    {
        maxRetries = MAX_RETRY,
        initialDelayMs = 1000,
        maxDelayMs = 10000,
        backoffFactor = 2,
    }: RetryOptions = {}
  ): Promise<T> {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;
            
            console.error(`Attempt ${attempt} failed:`, error);            
            if (attempt === maxRetries) break;
            
            const baseDelay = initialDelayMs * Math.pow(backoffFactor, attempt - 1);
            const jitteredDelay = baseDelay * (0.5 + Math.random() * 0.5);
            const finalDelay = Math.min(jitteredDelay, maxDelayMs);
            
            await new Promise(resolve => setTimeout(resolve, finalDelay));
        }
    }
    
    throw lastError;
  }

  private uuid() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16)
    );
  }
}

(window as any).SOFTPPROBE_RECORD_SDK = RecordSdk;
