import { record as rrwebRecord } from 'rrweb';
import { recordOptions } from 'rrweb/typings/types';
import { mergeTags } from './utils';

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

    const stopFn = rrwebRecord({
      emit: (event) => {
        this.events.push(event);
      },
      ...this.recordOptions,
      ...options
    });

    const timer = setInterval(
      () =>
        this.save({
          tags
        }),
      this.interval
    );

    return {
      stop: () => {
        clearInterval(timer);
        stopFn?.();
        this.save({
          tags
        });
      }
    };
  }

  setTags(tags: Tags, override = false) {
    this.tags = override ? tags : { ...this.tags, ...tags };
  }

  private save(params?: { tags?: Tags }) {
    if (this.events.length === 0) return;

    const body = JSON.stringify({
      appId: this.appId,
      events: this.events,
      recordId: this.recordId,
      ...mergeTags(this.tags, params?.tags)
    });

    console.log({ tags: mergeTags(this.tags, params?.tags) });

    this.events = [];

    fetch(this.serverUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Arex-Tenant-Code': this.tenantCode
      },
      body
    });
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
