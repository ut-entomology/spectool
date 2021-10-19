
import { ClientApi } from './client_api'

export class Backend {

  static getFirstNames(window: Window,
    username: string, password: string, lastName: string,
    onSuccess: (firstNames: string[]) => void,
    onError: (err: Error) => void
  ): void {
    ClientApi.sendAsync(window, "get-first-names",
      { username, password, lastName }, onSuccess, onError)
  }
}
