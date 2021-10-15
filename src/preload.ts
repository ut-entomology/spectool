import {
  contextBridge,
  ipcRenderer
} from 'electron'

// TODO: Define my specific APIs, so no need for whitelisting.

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  "api", {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  receive: (channel: string, func: (...data: any) => void) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on(channel, (_event, ...args) => func(...args))
  }
})
