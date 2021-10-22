/// <reference types="svelte" />

import "svelte";

declare global {
  interface Window {
    ipc: {
      sendSync: (channel: string, data: any) => any;
      send: (channel: string, data: any) => void;
      receive: (channel: string, func: (data: any) => void) => void;
      receiveOnce: (channel: string, func: (data: any) => void) => void;
    };
  }
}
