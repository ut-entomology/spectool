import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { DatabaseConfig } from '../../shared/db_config';
import { AppKernel } from '../../kernel/app_kernel';

class GetDatabaseConfigIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_database_config');
    this.kernel = kernel;
  }

  handler(_data: any) {
    return this.kernel.databaseConfig;
  }
}

class SetDatabaseConfigIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('set_database_config');
    this.kernel = kernel;
  }

  async handler(config: DatabaseConfig) {
    return await this.kernel.saveDatabaseConfig(config);
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new GetDatabaseConfigIpc(kernel), // multiline
    new SetDatabaseConfigIpc(kernel)
  ];
}
