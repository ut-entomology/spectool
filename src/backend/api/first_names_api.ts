import { IpcMainEvent } from 'electron'

import { AppKernel } from '../../kernel/app_kernel'
import { IpcHandler, AsyncIpcHandler } from '../util/ipc_handler'
import * as dbtest from '../../kernel/dbtest'

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
        obj.reply(event, err ? err : firstNames)
      })
  }
}

export default function (_kernel: AppKernel): IpcHandler[] {
  return [
    new GetFirstNamesIpc()
  ]
}
