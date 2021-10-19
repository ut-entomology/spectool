import type { Ipc } from '../bridge/ipc'

export class Backend {

  static getFirstNames(
    window: Window,
    username: string, password: string, lastName: string,
    callback: (err: any, firstNames: string[]) => void)
  : void {
    const ipc = window.ipc as Ipc
    const eventName = "get-first-names"
    ipc.receive(eventName, callback)
    ipc.send(eventName, { username, password, lastName })
  }
}
