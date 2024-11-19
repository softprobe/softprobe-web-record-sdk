/// <reference types="vite/client" />
import AREX_RECORD_SDK from './lib/sdk.ts';

declare global {
  interface Global {
    AREX_RECORD_SDK: typeof AREX_RECORD_SDK;
  }
}
