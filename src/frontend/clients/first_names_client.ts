import { ClientIpc } from '../util/client_ipc';

export class FirstNamesClient {
  static getFirstNames(
    window: Window,
    lastName: string,
    onSuccess: (firstNames: string[]) => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, 'get_first_names', lastName, onSuccess, onError);
  }
}
