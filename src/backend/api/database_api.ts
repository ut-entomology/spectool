import { IpcMainEvent } from 'electron';

import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppKernel } from '../../kernel/app_kernel';
import { Credentials } from '../../shared/Credentials';

class GetDatabaseCredsIpc extends SyncIpcHandler<void, Credentials | null> {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_database_creds');
    this.kernel = kernel;
  }

  handle(event: IpcMainEvent, _data: any): void {
    this.reply(event, this.kernel.databaseCreds.get());
  }
}

class LoginToDatabaseIpc extends AsyncIpcHandler<Credentials, null> {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_database');
    this.kernel = kernel;
  }

  handle(event: IpcMainEvent, creds: Credentials): void {
    const obj = this;
    this.kernel.databaseCreds
      .set(creds.username, creds.password)
      .then(() => {
        const db = obj.kernel.database;
        return obj.kernel.databaseCreds.test(db);
      })
      .then((err) => {
        obj.reply(event, err);
      })
      .catch((err) => {
        obj.reply(event, err);
      });
  }
}

class LogoutOfDatabaseIpc extends AsyncIpcHandler<void, null> {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('logout_of_database');
    this.kernel = kernel;
  }

  handle(event: IpcMainEvent, _data: any): void {
    const obj = this;
    this.kernel.databaseCreds
      .clear()
      .then(() => {
        const db = obj.kernel.database;
        return obj.kernel.databaseCreds.test(db);
      })
      .then((err) => {
        obj.reply(event, err === null ? Error('Failed to logout of database') : null);
      })
      .catch((err) => {
        obj.reply(event, err);
      });
  }
}

export default function (kernel: AppKernel): IpcHandler<any, any>[] {
  return [
    new GetDatabaseCredsIpc(kernel), // multiline
    new LoginToDatabaseIpc(kernel),
    new LogoutOfDatabaseIpc(kernel)
  ];
}
