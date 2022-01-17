import { PassThroughError } from 'electron-ipc-methods/main';

import type { AppKernel } from '../../kernel/app_kernel';
import type { Credentials } from '../../shared/credentials';
import { Connection } from '../../shared/connection';
import { connectionPub } from '../../app/connectionPub';

let connection: Connection;
connectionPub.subscribe((conn) => {
  connection = conn;
});

export class DatabaseApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getExistingConnection() {
    return connection;
  }

  async getSavedCreds() {
    return this._kernel.getSavedDatabaseCreds();
  }

  async login(creds: Credentials) {
    try {
      const databaseCreds = this._kernel.databaseCreds;
      await databaseCreds.set(creds.username, creds.password);
      const conn = new Connection(true, creds.username, await databaseCreds.validate());
      connectionPub.set(conn);
      return conn;
    } catch (err: any) {
      throw new PassThroughError(err);
    }
  }

  async loginAndSave(creds: Credentials) {
    try {
      const databaseCreds = this._kernel.databaseCreds;
      await databaseCreds.set(creds.username, creds.password);
      await databaseCreds.save();
      const conn = new Connection(true, creds.username, await databaseCreds.validate());
      connectionPub.set(conn);
      return conn;
    } catch (err: any) {
      throw new PassThroughError(err);
    }
  }

  async logout() {
    const obj = this;
    await this._kernel.databaseCreds.clear().then(async () => {
      try {
        await obj._kernel.databaseCreds.validate();
      } catch (err) {
        connectionPub.set(new Connection(true));
        return;
      }
      throw new PassThroughError(Error('Failed to disconnect from database'));
    });
  }
}
