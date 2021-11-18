import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppKernel } from '../../kernel/app_kernel';
import { Credentials } from '../../shared/credentials';
import { Connection } from '../../shared/connection';
import { connectionPub } from '../../app/connectionPub';

let connection: Connection;
connectionPub.subscribe((conn) => {
  connection = conn;
});

class GetConnectionIpc extends SyncIpcHandler {
  constructor(_kernel: AppKernel) {
    super('get_connection');
  }

  handler(_data: any) {
    return connection;
  }
}

class DatabaseLoginIsSavedIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('database_login_is_saved');
    this.kernel = kernel;
  }

  handler(_data: any) {
    return this.kernel.databaseCreds.isSaved();
  }
}

class LoginToDatabaseIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_database');
    this.kernel = kernel;
  }

  async handler(creds: Credentials) {
    const databaseCreds = this.kernel.databaseCreds;
    await databaseCreds.set(creds.username, creds.password);
    return await databaseCreds.validate();
  }
}

class LoginToDatabaseAndSaveIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_database_and_save');
    this.kernel = kernel;
  }

  async handler(creds: Credentials) {
    const databaseCreds = this.kernel.databaseCreds;
    await databaseCreds.set(creds.username, creds.password);
    const collections = await databaseCreds.validate();
    await databaseCreds.save();
    return collections;
  }
}

class LogoutOfDatabaseIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('logout_of_database');
    this.kernel = kernel;
  }

  async handler(_data: any) {
    const obj = this;
    await this.kernel.databaseCreds.clear().then(async () => {
      try {
        await obj.kernel.databaseCreds.validate();
      } catch (err) {
        return;
      }
      throw Error('Failed to disconnect from database');
    });
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new GetConnectionIpc(kernel), // multiline
    new DatabaseLoginIsSavedIpc(kernel),
    new LoginToDatabaseIpc(kernel),
    new LoginToDatabaseAndSaveIpc(kernel),
    new LogoutOfDatabaseIpc(kernel)
  ];
}
