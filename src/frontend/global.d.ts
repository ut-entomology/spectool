import type { MainApis } from './lib/main_client';

declare global {
  interface Window {
    apis: MainApis;
  }
}
