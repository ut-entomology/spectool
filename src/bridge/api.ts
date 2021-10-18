
import { ipcRenderer } from 'electron'

export class Api {

  send(channel: string, data: any): void {
    ipcRenderer.send(channel, data)
  }

  receive(channel: string, func: (...data: any) => void): void {
    // Deliberately strip event as it includes `sender`
    ipcRenderer.on(channel, (_event, ...args) => func(...args))
  }
}
