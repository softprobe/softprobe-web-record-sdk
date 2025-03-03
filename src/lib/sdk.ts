import { record as rrwebRecord } from 'rrweb';
import { recordOptions } from 'rrweb/typings/types';
import { UAParser } from 'ua-parser-js';
import heatmapStill from './heatmapStill';

const MAX_EVENTS = 500;

export type SystemInfo = {
  '_sp_ua': string;
  '_sp_url': string;
  '_sp_search': string;
  '_sp_referer': string | null;
  '_sp_os': string;
  '_sp_osVersion': string;
  '_sp_browser': string;
  '_sp_browserVersion': string;
  '_sp_cpu': string;
  '_sp_device': string;
  '_sp_width': number;
  '_sp_height': number;
  '_sp_scrollWidth': number;
  '_sp_scrollHeight': number;
  '_sp_vid': string;
}

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
  // TODO: remove tenantId and derive it from appId instead
  tenantId: string; // The tenant id
  appId: string; // The app id
  serverUrl?: string; // The URL of the server
  interval?: number; // The interval of the recording
  manual?: boolean; // Whether to manually start the recording
}

export interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
  retryableErrors?: Array<string | RegExp>;
  shouldRetry?: (error: any) => boolean;
}

export class RecordSdk {
  private events: any[] = [];
  private readonly appId: string;
  private readonly tenantId: string;
  private readonly sessionId: string;
  private readonly serverUrl: string;
  private readonly interval: number;
  private readonly recordOptions: recordOptions<any>;
  private tags: Tags;
  private systemInfo: SystemInfo | null = null;
  private hasNewEvent: boolean = true;
  private visitorId: string;
  private readonly COOKIE_NAME = '_sp_vid';
  private readonly COOKIE_DOMAIN: string;
  private readonly COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

  constructor(options: RecordSdkOptions) {
    const {
      tenantId,
      appId,
      serverUrl = 'https://www.softprobe.ai/api/v1/recording',
      interval = 5000,
      manual = false,
      tags = {},
      ...recordOptions
    } = options;

    if (!appId) {
      throw new Error('appId is required');
    }
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    this.tenantId = tenantId;
    this.appId = appId;
    this.sessionId = this.uuid();
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

    const emitEvent: recordOptions<any>['emit'] = async (event: any) => {
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

    const intervalId = setInterval(async () => {
      // Save the events 
      this.save({ tags })

      // Save heatmap data
      // Not nessary, allow to fail silently
      const sysInfo = await this.getSystemInfo();
      const getHeatmapData = heatmapStill(sysInfo, this.events);
      console.log('getHeatmapData', getHeatmapData);
      // TODO: send heatmap data to backend
    }, this.interval);

    return {
      stop: () => {
        clearInterval(intervalId);
        stopFn?.();
        this.save({ tags }); // Final save when stopping
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
      '_sp_ua': result.ua,
      '_sp_url': window.location.hostname + window.location.pathname,
      '_sp_search': window.location.search,
      '_sp_referer': document.referrer || null,
      '_sp_os': result.os.name || 'Unknown',
      '_sp_osVersion': result.os.version || 'Unknown',
      '_sp_browser': result.browser.name || 'Unknown',
      '_sp_browserVersion': result.browser.version || 'Unknown',
      '_sp_cpu': result.cpu.architecture || 'Unknown',
      '_sp_device': result.device.type || 'desktop', // UAParser returns undefined for desktop, so default to 'desktop'
      '_sp_width': window.innerWidth,
      '_sp_height': window.innerHeight,
      '_sp_scrollWidth': document.documentElement.scrollWidth,
      '_sp_scrollHeight': document.documentElement.scrollHeight,
      '_sp_vid': this.visitorId
    };

    return this.systemInfo;
  }

  private async save(params?: { tags?: Tags }) {
    if (this.events.length === 0) return;

    // Use a static flag to prevent concurrent saves
    if ((this.save as any).isSaving) return;
    (this.save as any).isSaving = true;

    try {
      if (!this.systemInfo) {
        this.systemInfo = await this.getSystemInfo();
      }

      const body = JSON.stringify({
        metadata: {
          appId: this.appId,
          sessionId: this.sessionId,
          tenantId: this.tenantId,
          tags: {
            ...this.systemInfo,
            ...this.tags,
            ...params?.tags,
          },
        },
        data: {
          events: this.events,
        },
      });

      const fetchRes = await fetch(this.serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
        redirect: 'follow',
        // credentials: 'include' // Include cookies in cross-origin requests
      });

      if (!fetchRes.ok) {
        throw new Error(`HTTP error! Status Code: ${fetchRes.status}. Details: ${await fetchRes.text()}`);
      }

      // empty the events array
      this.events = [];
    } catch (error) {
      console.error('Failed to save events:', error);
    } finally {
      (this.save as any).isSaving = false;
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
}

// a helper function to initialize the sdk and start recording
export default function initSoftprobe(options: RecordSdkOptions) {
  return new RecordSdk(options);
}

// Export for browser global usage
(window as any).RecordSdk = RecordSdk;
(window as any).initSoftprobe = initSoftprobe;
