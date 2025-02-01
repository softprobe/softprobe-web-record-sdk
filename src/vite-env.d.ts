/// <reference types="vite/client" />
import SOFTPROBE_RECORD_SDK from './lib/sdk.ts';

declare global {
  interface Global {
    SOFTPROBE_RECORD_SDK: typeof SOFTPROBE_RECORD_SDK;
  }
}
