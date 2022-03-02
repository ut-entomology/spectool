import type { ElectronMainApi } from 'electron-affinity/main';

import type { DatabaseConfig } from '../../shared/shared_db_config';
import type { AppKernel } from '../../backend/app/app_kernel';

export class DatabaseConfigApi implements ElectronMainApi<DatabaseConfigApi> {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getConfig() {
    return this._kernel.databaseConfig;
  }

  async setConfig(config: DatabaseConfig) {
    return await this._kernel.saveDatabaseConfig(config);
  }
}
