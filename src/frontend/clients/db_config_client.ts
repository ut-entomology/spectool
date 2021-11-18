import { ClientIpc } from '../util/client_ipc';
import { DatabaseConfig } from '../shared/db_config';

export class DatabaseConfigClient {
  static getConfig(): DatabaseConfig {
    return new DatabaseConfig(ClientIpc.sendSync(window, 'get_database_config'));
  }

  static setConfig(config: DatabaseConfig): Promise<void> {
    return ClientIpc.sendAsync(window, 'set_database_config', config);
  }
}
