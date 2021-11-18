import { contextBridge } from 'electron';
import { ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('ipc', {
  invoke: (channel: string, data: any) => {
    return ipcRenderer.invoke(channel, data);
  },
  sendSync: (channel: string, data: any) => {
    return ipcRenderer.sendSync(channel, data);
  },
  send: (channel: string, data: any) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel: string, func: (data: any) => void) => {
    // Don't pass along event as it includes `sender`
    ipcRenderer.on(channel, (_event, args) => func(args));
  }
});
