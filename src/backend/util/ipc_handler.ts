import { IpcMainEvent } from 'electron';

export abstract class IpcHandler<Req, Res> {
  channel: string;

  constructor(channel: string) {
    this.channel = channel;
  }

  abstract handle(event: IpcMainEvent, data: Req): void;

  protected abstract reply(event: IpcMainEvent, dataOrError: Res | Error): void;
}

export abstract class AsyncIpcHandler<Req, Res> extends IpcHandler<Req, Res> {
  constructor(channel: string) {
    super(channel);
  }

  protected reply(event: IpcMainEvent, dataOrError: Res | Error): void {
    event.reply(this.channel + '_reply', dataOrError);
  }
}

export abstract class SyncIpcHandler<Req, Res> extends IpcHandler<Req, Res> {
  constructor(channel: string) {
    super(channel);
  }

  protected reply(event: IpcMainEvent, data: Res): void {
    event.returnValue = data;
  }
}
