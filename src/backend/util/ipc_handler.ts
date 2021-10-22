import { IpcMainEvent } from 'electron';

export abstract class IpcHandler {
  channel: string;

  constructor(channel: string) {
    this.channel = channel;
  }

  abstract handle(event: IpcMainEvent, data: any): void;

  protected abstract reply(event: IpcMainEvent, dataOrError: any): void;
}

export abstract class AsyncIpcHandler extends IpcHandler {
  constructor(channel: string) {
    super(channel);
  }

  protected reply(event: IpcMainEvent, dataOrError: any): void {
    event.reply(this.channel + '-reply', dataOrError);
  }
}

export abstract class SyncIpcHandler extends IpcHandler {
  constructor(channel: string) {
    super(channel);
  }

  protected reply(event: IpcMainEvent, dataOrError: any): void {
    event.returnValue = dataOrError;
  }
}
