import { record as rrwebRecord } from 'rrweb';
import { recordOptions } from 'rrweb/typings/types';
import { mergeTags } from './utils';

const MAX_EVENTS = 500; // 设置最大事件数量
const MAX_RETRY = 3; // 设置最大重试次数

export type Tags = {
  userId?: string;
  clientId?: string;
  mobileNo?: string;
  ext?: Record<string, string>;
};

export interface ArexManualRecordSdkOptions extends recordOptions<any> {
  tags?: Tags;
}

export interface ArexRecordSdkOptions extends ArexManualRecordSdkOptions {
  appId: string;
  tenantCode: string;
  serverUrl: string;
  interval?: number;
  manual?: boolean;
}

export default class ArexRecordSdk {
  private events: any[] = [];
  private readonly appId: string;
  private readonly tenantCode: string;
  private readonly recordId: string;
  private readonly serverUrl: string;
  private readonly interval: number;
  private readonly recordOptions: recordOptions<any>;
  private tags: Tags;

  constructor(options: ArexRecordSdkOptions) {
    const {
      appId,
      tenantCode,
      serverUrl = '//storage.arextest.com/api/rr/record',
      interval = 5000,
      manual = false,
      tags = {},
      ...recordOptions
    } = options;

    this.appId = appId;
    this.tenantCode = tenantCode;
    this.recordId = this.uuid();
    this.serverUrl = serverUrl.startsWith('//')
      ? `${window.location.protocol}${serverUrl}`
      : serverUrl;
    this.interval = Math.max(interval, 5000);
    this.tags = tags;
    this.recordOptions = recordOptions;

    this.init();

    !manual && this.record();

    return this;
  }

  record(recordOptions?: ArexManualRecordSdkOptions) {
    const { tags = {}, ...options } = recordOptions || {};
    let isSaving = false;

    const emitEvent: recordOptions<any>['emit'] = (event) => {
      if (this.events.length >= MAX_EVENTS) {
        this.events.shift(); // remove the oldest event
      }
      this.events.push(event);
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
    if (this.events.length === 0) return;

    const body = JSON.stringify({
      appId: this.appId,
      events: this.events,
      recordId: this.recordId,
      ...mergeTags(this.tags, params?.tags)
    });

    let attempts = 0;

    while (attempts < MAX_RETRY) {
      try {
        const fetchRes = await fetch(this.serverUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Arex-Tenant-Code': this.tenantCode
          },
          body
        });

        if (!fetchRes.ok) {
          throw new Error(`HTTP error! Status: ${fetchRes.status}`);
        }

        const fetchData = await fetchRes.json();

        if (fetchData.body === true) {
          this.events = []; // Clear events on successful save
          return; // Exit after successful save
        } else {
          throw new Error('Failed to save record');
        }
      } catch (e) {
        console.error(e);
        attempts++;
        if (attempts === MAX_RETRY) {
          console.error(
            'Max retries reached. Events will be retained for next attempt.'
          );
        }
      }
    }
  }

  private uuid() {
    return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16)
    );
  }

  private init() {
    XMLHttpRequest.prototype.open = (function (open) {
      return function () {
        // @ts-ignore
        open.apply(this, arguments);
        // @ts-ignore
        this.setRequestHeader('arex-fe-record-id', this.recordId);
        // @ts-ignore
        this.setRequestHeader('arex-fe-app-id', this.appId);
        // @ts-ignore
        this.setRequestHeader('arex-force-record', 'true');
      };
    })(XMLHttpRequest.prototype.open);

    console.log('RR-Record Session: ' + this.recordId);
  }
}

(window as any).AREX_RECORD_SDK = ArexRecordSdk;
