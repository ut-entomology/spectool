import { IpcMainEvent } from 'electron'

export abstract class IpcHandler {

  channel: string

  constructor(channel: string) {
    this.channel = channel
  }

  abstract handle(event: IpcMainEvent, data: any): void

  protected abstract reply(event: IpcMainEvent, err: any, data: any): void
}

export abstract class AsyncIpcHandler extends IpcHandler {

  constructor(channel: string) {
    super(channel)
  }

  protected reply(event: IpcMainEvent, err: any, data: any): void {
    event.reply(this.channel + "-reply", err ? err : data)
  }
}

export abstract class SyncIpcHandler extends IpcHandler {

  constructor(channel: string) {
    super(channel)
  }

  protected reply(event: IpcMainEvent, err: any, data: any): void {
    event.returnValue = err ? err : data
  }
}
