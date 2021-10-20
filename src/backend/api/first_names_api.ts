import { IpcMainEvent } from 'electron'

import { AsyncIpcHandler } from '../util/ipc_handler'
import * as dbtest from '../dbtest'

class GetFirstNamesIpc extends AsyncIpcHandler {

  constructor() {
    super("get-first-names")
  }

  handle(event: IpcMainEvent,
    data: {username: string, password: string, lastName: string}
  ): void {
    const obj = this
    dbtest.getFirstNames(data.username, data.password, data.lastName,
      (err, firstNames) => {
        obj.reply(event, err, firstNames)
      })
  }
}

export const ipcHandlers = [
  new GetFirstNamesIpc()
]
