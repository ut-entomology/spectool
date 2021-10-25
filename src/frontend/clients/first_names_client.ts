import { ClientIpc } from '../util/client_ipc';

export class FirstNamesClient {
  static getFirstNames(window: Window, lastName: string): Promise<string[]> {
    return ClientIpc.sendAsync(window, 'get_first_names', lastName);
  }
}
