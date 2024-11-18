import { record as rrwebRecord } from "rrweb";
import { recordOptions } from "rrweb/typings/types";

export interface AREX_RECORD_SDK_OPTIONS extends recordOptions<any> {
  appId: string;
  tenantCode: string;
  serverUrl?: string;
  timeout?: number;
  manual?: boolean;
}

export default class AREX_RECORD_SDK {
  private events: any[] = [];
  private readonly appId: string;
  private readonly tenantCode: string;
  private readonly recordId: string;
  private readonly serverUrl: string;
  private readonly timeout: number;
  private readonly recordOptions: recordOptions<any>;

  constructor(options: AREX_RECORD_SDK_OPTIONS) {
    const {
      appId,
      tenantCode,
      serverUrl = "http://arex-storage.fat3.tripqate.com/api/rr/record",
      timeout = 5000,
      manual = false,
      ...recordOptions
    } = options;
    this.appId = appId;
    this.tenantCode = tenantCode;
    this.recordId = this.uuid();
    this.timeout = timeout;
    this.serverUrl = serverUrl;
    this.recordOptions = recordOptions;

    this.init();

    !manual && this.record();

    return this;
  }

  record() {
    const stopFn = rrwebRecord({
      emit: (event) => {
        this.events.push(event);
      },
      ...this.recordOptions,
    });

    const timer = setInterval(() => this.save(), this.timeout);

    return {
      stop: () => {
        clearInterval(timer);
        stopFn?.();
        this.save();
      },
    };
  }

  private save() {
    if (this.events.length === 0) return;

    const body = JSON.stringify({
      appId: this.appId,
      events: this.events,
      recordId: this.recordId,
    });

    this.events = [];
    fetch(this.serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Arex-Tenant-Code": this.tenantCode,
      },
      body,
    });
  }

  private uuid() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
      (
        +c ^
        (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))
      ).toString(16),
    );
  }

  private init() {
    XMLHttpRequest.prototype.open = (function (open) {
      return function () {
        // @ts-ignore
        open.apply(this, arguments);
        // @ts-ignore
        this.setRequestHeader("arex-fe-record-id", this.recordId);
        // @ts-ignore
        this.setRequestHeader("arex-fe-app-id", this.appId);
        // @ts-ignore
        this.setRequestHeader("arex-force-record", "true");
      };
    })(XMLHttpRequest.prototype.open);

    console.log("RR-Record Session: " + this.recordId);
  }
}

window.AREX_RECORD_SDK = AREX_RECORD_SDK;
