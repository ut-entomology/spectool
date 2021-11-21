import { ClientIpc } from '../util/client_ipc';
import { Connection } from '../../shared/connection';
import type { Credentials } from '../../shared/credentials';

export class DatabaseClient {
  static getExistingConnection(): Connection {
    const result = ClientIpc.sendSync(window, 'get_existing_connection');
    return Connection.construct(result);
  }

  static getSavedCreds(): Credentials | null {
    return ClientIpc.sendSync(window, 'get_saved_database_creds');
  }

  static async login(creds: Credentials): Promise<Connection> {
    const result = ClientIpc.sendAsync(window, 'login_to_database', creds);
    return Connection.construct(await result);
  }

  static async loginAndSave(creds: Credentials): Promise<Connection> {
    const result = ClientIpc.sendAsync(window, 'login_to_database_and_save', creds);
    return Connection.construct(await result);
  }

  static logout(): Promise<void> {
    return ClientIpc.sendAsync(window, 'logout_of_database');
  }
}
