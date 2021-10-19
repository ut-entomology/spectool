
import { ClientApi } from './client_api'

export class Backend {

  static getFirstNames(window: Window,
    username: string, password: string, lastName: string,
    callback: (err?: Error, firstNames?: string[]) => void
  ): void {
    ClientApi.sendAsync(window, "get-first-names",
      { username, password, lastName }, callback)
  }
}
