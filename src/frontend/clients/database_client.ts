import { ClientIpc } from '../util/client_ipc';
import type { Credentials } from '../../shared/Credentials';

export class DatabaseClient {
  static getCredentials(window: Window): Credentials | null {
    return ClientIpc.sendSync(window, 'get_database_creds', undefined);
  }

  static login(
    window: Window,
    creds: Credentials,
    onSuccess: () => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, 'login_to_database', creds, onSuccess, onError);
  }

  static logout(
    window: Window,
    onSuccess: () => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, 'logout_of_database', undefined, onSuccess, onError);
  }
}
