import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppKernel } from '../../kernel/app_kernel';
import { Credentials } from '../../shared/Credentials';

class GetDatabaseCredsIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_database_creds');
    this.kernel = kernel;
  }

  handle(_data: any): Credentials | null {
    return this.kernel.databaseCreds.get();
  }
}

class LoginToDatabaseIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_database');
    this.kernel = kernel;
  }

  async handle(creds: Credentials): Promise<void> {
    const obj = this;
    await this.kernel.databaseCreds
      .set(creds.username, creds.password)
      .then(async () => {
        const db = obj.kernel.database;
        const err = obj.kernel.databaseCreds.test(db);
        if (err) throw err;
      });
  }
}

class LogoutOfDatabaseIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('logout_of_database');
    this.kernel = kernel;
  }

  async handle(_data: any): Promise<void> {
    const obj = this;
    await this.kernel.databaseCreds.clear().then(() => {
      const db = obj.kernel.database;
      const err = obj.kernel.databaseCreds.test(db);
      if (!err) throw Error('Failed to logout of database');
    });
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new GetDatabaseCredsIpc(kernel), // multiline
    new LoginToDatabaseIpc(kernel),
    new LogoutOfDatabaseIpc(kernel)
  ];
}
