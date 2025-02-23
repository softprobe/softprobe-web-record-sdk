import { record as rrwebRecord } from 'rrweb';
import { recordOptions } from 'rrweb/typings/types';
import { UAParser } from 'ua-parser-js';

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
  appId: string; // The app id
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
  private readonly appId: string;
  private readonly authToken: string;
  private readonly recordId: string;
  private readonly serverUrl: string;
  private readonly interval: number;
  private readonly recordOptions: recordOptions<any>;
  private tags: Tags;
  private systemInfo: any;
  private hasNewEvent: boolean = true;
  private visitorId: string;
  private readonly COOKIE_NAME = '_sp_vid';
  private readonly COOKIE_DOMAIN: string;
  private readonly COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

  constructor(options: RecordSdkOptions) {
    const {
      authToken,
      appId,
      serverUrl = 'https://upload.softprobe.ai',
      interval = 5000,
      manual = false,
      tags = {},
      ...recordOptions
    } = options;

    if (!appId) {
      throw new Error('appId is required');
    }
    if (!authToken) {
      throw new Error('authToken is required');
    }

    this.authToken = authToken;
    this.appId = appId;
    this.recordId = this.uuid();
    this.serverUrl = serverUrl.startsWith('//')
      ? `${window.location.protocol}${serverUrl}`
      : serverUrl;
    this.interval = Math.max(interval, 5000);
    this.tags = tags;
    this.recordOptions = recordOptions;
    
    // Determine cookie domain based on serverUrl
    const serverUrlObj = new URL(this.serverUrl);
    this.COOKIE_DOMAIN = serverUrlObj.hostname.startsWith('localhost') 
      ? 'localhost'
      : `.${serverUrlObj.hostname.split('.').slice(-2).join('.')}`;

    // Initialize visitor ID
    this.visitorId = this.getOrCreateVisitorId();

    !manual && this.record();

    return this;
  }

  private getOrCreateVisitorId(): string {    
    const existingId = this.getCookie(this.COOKIE_NAME);
    if (existingId) {
      return existingId;
    }

    const newId = this.uuid();
    this.setCookie(this.COOKIE_NAME, newId);
        
    return newId;
  }

  private setCookie(name: string, value: string): void {
    try {
      const isLocalhost = window.location.hostname === 'localhost';
      
      const cookieAttributes = [
        `${name}=${encodeURIComponent(value)}`,
        // Only set domain attribute if not on localhost
        ...(isLocalhost ? [] : [`domain=${this.COOKIE_DOMAIN}`]),
        `max-age=${this.COOKIE_MAX_AGE}`,
        'path=/',
        // Only set SameSite=None and Secure if not on localhost
        ...(isLocalhost 
          ? [] 
          : ['SameSite=None', 'Secure']
        )
      ];

      const cookieString = cookieAttributes.join('; ');
      document.cookie = cookieString;
    } catch (error) {
      console.error('Error in setCookie:', error);
      throw error;
    }
  }

  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [cookieName, cookieValue] = cookie.trim().split('=');
      if (cookieName === name) {
        return cookieValue;
      }
    }
    return null;
  }

  public record(recordOptions?: ManualRecordSdkOptions) {
    const { tags = {}, ...options } = recordOptions || {};
    let isSaving = false;

    const emitEvent: recordOptions<any>['emit'] = async (event: any) => {
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

  public setTags(tags: Tags, override = false) {
    this.tags = override ? tags : { ...this.tags, ...tags };
  }

  public async getSystemInfo() {
    // Create a parser instance to extract UA details
    const parser = new UAParser();
    const result = await parser.getResult().withClientHints();

    // Initialize and remember the metadata
    this.systemInfo = {
      '__sp.appId': this.appId,
      '__sp.recordId': this.recordId,
      '__sp.ua': result.ua,
      '__sp.referer': document.referrer || null,
      '__sp.os': result.os.name || 'Unknown',
      '__sp.osVersion': result.os.version || 'Unknown',
      '__sp.browser': result.browser.name || 'Unknown',
      '__sp.browserVersion': result.browser.version || 'Unknown',
      '__sp.cpu': result.cpu.architecture || 'Unknown',
      '__sp.device': result.device.type || 'desktop', // UAParser returns undefined for desktop, so default to 'desktop'
      '__sp.width': window.innerWidth,
      '__sp.height': window.innerHeight,
      '__sp.visitorId': this.visitorId
    };

    return this.systemInfo;
  }

  private async save(params?: { tags?: Tags }) {
    if (this.events.length === 0 || !this.hasNewEvent) return;

    const body = JSON.stringify({
      events: this.events,
    });

    if (!this.systemInfo) {
      this.systemInfo = await this.getSystemInfo();
    }

    const tags = { ...this.tags, ...params?.tags, ...this.systemInfo };

    try {
      await this.retryOperation(async () => {
        const fetchRes = await fetch(this.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.authToken}`,
            'x-sp-app-id': this.appId,
            'x-sp-record-id': this.recordId,
            'x-sp-visitor-id': this.visitorId,
            'x-sp-tags': JSON.stringify(tags),
          },
          body,
          redirect: 'follow',
          // credentials: 'include' // Include cookies in cross-origin requests
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
