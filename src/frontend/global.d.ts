/// <reference types="svelte" />

import 'svelte'

declare global {
  interface Window {
    api: {
			send: (channel: string, data: any) => void
			receive: (channel: string, func: (data: any) => void) => void
		}
  }
}
