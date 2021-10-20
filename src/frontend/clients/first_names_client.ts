
import { ClientIpc } from '../util/client_ipc'

export class FirstNamesClient {

  static getFirstNames(window: Window,
    username: string, password: string, lastName: string,
    onSuccess: (firstNames: string[]) => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, "get-first-names",
      { username, password, lastName }, onSuccess, onError)
  }
}
