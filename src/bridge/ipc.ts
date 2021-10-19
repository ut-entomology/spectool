import { IpcMainEvent } from 'electron'

import * as dbtest from '../backend/dbtest'

export abstract class IpcHandler {

  name: string

  constructor(name: string) {
    this.name = name
  }

  abstract handler(event: IpcMainEvent, data: any): void
}

export class GetFirstNamesIpc extends IpcHandler {

  constructor() {
    super("get-first-names")
  }

  handler(event: IpcMainEvent,
    data: {username: string, password: string, lastName: string}
  ): void {
    const self = this
    dbtest.getFirstNames(data.username, data.password, data.lastName,
      (err, firstNames) => {
        if (err)
          event.reply("app-error", err.message)
        else
          event.reply(self.name, firstNames)
      })
  }
}