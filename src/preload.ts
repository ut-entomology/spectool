import { contextBridge } from 'electron'
import { ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld(
  "ipc", {
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data)
  },
  receive: (channel: string, func: (...data: any) => void) => {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on(channel, (_event, ...args) => func(...args))
  }
})
