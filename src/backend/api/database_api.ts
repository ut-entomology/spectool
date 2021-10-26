import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppKernel } from '../../kernel/app_kernel';
import { Credentials } from '../../shared/Credentials';

class GetDatabaseUsernameIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_database_username');
    this.kernel = kernel;
  }

  handle(_data: any): string | null {
    const creds = this.kernel.databaseCreds.get();
    return creds ? creds.username : null;
  }
}

class LoginToDatabaseIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_database');
    this.kernel = kernel;
  }

  async handle(creds: Credentials): Promise<void> {
    const databaseCreds = this.kernel.databaseCreds;
    await databaseCreds.set(creds.username, creds.password);
    await databaseCreds.test(this.kernel.database);
  }
}

class LoginToDatabaseAndSaveIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_database_and_save');
    this.kernel = kernel;
  }

  async handle(creds: Credentials): Promise<void> {
    const databaseCreds = this.kernel.databaseCreds;
    await databaseCreds.set(creds.username, creds.password);
    await databaseCreds.test(this.kernel.database);
    await databaseCreds.save();
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
    await this.kernel.databaseCreds.clear().then(async () => {
      try {
        const db = obj.kernel.database;
        await obj.kernel.databaseCreds.test(db);
      } catch (err) {
        return;
      }
      throw Error('Failed to log out of database');
    });
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new GetDatabaseUsernameIpc(kernel), // multiline
    new LoginToDatabaseIpc(kernel),
    new LoginToDatabaseAndSaveIpc(kernel),
    new LogoutOfDatabaseIpc(kernel)
  ];
}
