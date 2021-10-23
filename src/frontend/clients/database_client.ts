import { ClientIpc } from '../util/client_ipc';

export class DatabaseClient {
  static getCredentials(window: Window): [string, string] | null {
    return ClientIpc.sendSync(window, 'get_database_creds', undefined);
  }

  static login(
    window: Window,
    username: string,
    password: string,
    onSuccess: () => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(
      window,
      'login_to_database',
      [username, password],
      onSuccess,
      onError
    );
  }

  static logout(
    window: Window,
    onSuccess: () => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, 'logout_of_database', undefined, onSuccess, onError);
  }
}
