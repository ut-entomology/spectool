/// <reference types="svelte" />

import 'svelte'

declare global {
  interface Window {
    ipc: any
  }
}
