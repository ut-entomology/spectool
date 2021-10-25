import { ClientIpc } from '../util/client_ipc';
import type { Credentials } from '../../shared/Credentials';

export class DatabaseClient {
  static getCredentials(window: Window): Credentials | null {
    return ClientIpc.sendSync(window, 'get_database_creds');
  }

  static login(window: Window, creds: Credentials): Promise<void> {
    return ClientIpc.sendAsync(window, 'login_to_database', creds);
  }

  static logout(window: Window): Promise<void> {
    return ClientIpc.sendAsync(window, 'logout_of_database');
  }
}
