
export class Backend {

  static getFirstNames(window: Window,
    username: string, password: string, lastName: string,
    callback: (firstNames: string[]) => void)
  : void {
    const eventName = "get-first-names"
    window.ipc.receiveOnce(eventName, callback)
    window.ipc.send(eventName, { username, password, lastName })
  }

  //static onError(window: Window,

}
