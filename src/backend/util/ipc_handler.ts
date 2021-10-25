import { IpcMain } from 'electron';

export abstract class IpcHandler {
  channel: string;

  constructor(channel: string) {
    this.channel = channel;
  }

  abstract register(ipcMain: IpcMain): void;
}

export abstract class AsyncIpcHandler extends IpcHandler {
  constructor(channel: string) {
    super(channel);
  }

  register(ipcMain: IpcMain): void {
    ipcMain.handle(this.channel, async (_event, request) => {
      try {
        // await before returning to keep Electron from writing errors
        const response = await this.handle(request);
        return response;
      } catch (err) {
        return err;
      }
    });
  }

  abstract handle(request: any): Promise<any>;
}

export abstract class SyncIpcHandler extends IpcHandler {
  constructor(channel: string) {
    super(channel);
  }

  register(ipcMain: IpcMain): void {
    ipcMain.on(this.channel, (event, request) => {
      event.returnValue = this.handle(request);
    });
  }

  abstract handle(request: any): any;
}
