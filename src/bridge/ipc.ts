import { IpcMainEvent } from 'electron'

import * as dbtest from '../backend/dbtest'

export abstract class IpcHandler {

  name: string

  constructor(name: string) {
    this.name = name
  }

  abstract handler(event: IpcMainEvent, data: any): void

  protected abstract reply(event: IpcMainEvent, err: any, data: any): void
}

export abstract class AsyncIpcHandler extends IpcHandler {

  constructor(name: string) {
    super(name)
  }

  protected reply(event: IpcMainEvent, err: any, data: any): void {
    if (err)
      event.reply("app-error", err.message)
    else
      event.reply(this.name, data)
  }
}

export class GetFirstNamesIpc extends AsyncIpcHandler {

  constructor() {
    super("get-first-names")
  }

  handler(event: IpcMainEvent,
    data: {username: string, password: string, lastName: string}
  ): void {
    const obj = this
    dbtest.getFirstNames(data.username, data.password, data.lastName,
      (err, firstNames) => {
        obj.reply(event, err, firstNames)
      })
  }
}