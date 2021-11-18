/// <reference types="svelte" />

import 'svelte';

declare global {
  interface Window {
    ipc: {
      invoke: (channel: string, data?: any) => Promise<any>;
      sendSync: (channel: string, data?: any) => any;
      send: (channel: string, data: any) => void;
      on: (channel: string, func: (data: any) => void) => void;
    };
  }
}
