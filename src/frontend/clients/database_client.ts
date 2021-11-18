import { ClientIpc } from '../util/client_ipc';
import type { SpecCollection } from '../../shared/schema';
import type { Connection } from '../../shared/connection';
import type { Credentials } from '../../shared/credentials';

export class DatabaseClient {
  static getConnection(): Connection {
    return ClientIpc.sendSync(window, 'get_connection');
  }

  static isSaved(): boolean {
    return ClientIpc.sendSync(window, 'database_login_is_saved');
  }

  static login(creds: Credentials): Promise<SpecCollection[]> {
    return ClientIpc.sendAsync(window, 'login_to_database', creds);
  }

  static loginAndSave(creds: Credentials): Promise<SpecCollection[]> {
    return ClientIpc.sendAsync(window, 'login_to_database_and_save', creds);
  }

  static logout(): Promise<void> {
    return ClientIpc.sendAsync(window, 'logout_of_database');
  }
}
