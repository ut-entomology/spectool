import { ClientIpc } from '../util/client_ipc';
import type { Credentials } from '../../shared/credentials';

export class DatabaseClient {
  static getUsername(window: Window): string | null {
    return ClientIpc.sendSync(window, 'get_database_username');
  }

  static isSaved(window: Window): boolean {
    return ClientIpc.sendSync(window, 'database_login_is_saved');
  }

  static login(window: Window, creds: Credentials): Promise<void> {
    return ClientIpc.sendAsync(window, 'login_to_database', creds);
  }

  static loginAndSave(window: Window, creds: Credentials): Promise<void> {
    return ClientIpc.sendAsync(window, 'login_to_database_and_save', creds);
  }

  static logout(window: Window): Promise<void> {
    return ClientIpc.sendAsync(window, 'logout_of_database');
  }
}
