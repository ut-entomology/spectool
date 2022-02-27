import * as mysql from 'mysql2/promise';
import { addTimeoutToPromisePool } from 'mysql2-timeout-additions';

import type { AppKernel } from './app/app_kernel';
import { SavableCredentials } from '../util/savable_creds';
import type { Collection } from '../shared/shared_connection';
import { UserError } from '../shared/shared_user';
import * as query from './specify/queries';

const CONNECTION_TIMEOUT_SECONDS = 15;

export class DatabaseCredentials extends SavableCredentials {
  private _kernel: AppKernel;
  private _database?: query.DB;

  constructor(kernel: AppKernel) {
    super(kernel.platform.appName, 'database');
    this._kernel = kernel;
  }

  async clear(): Promise<void> {
    await super.clear();
    if (this._database) {
      await this._database.end();
    }
    this._database = undefined;
  }

  connect(): query.DB {
    if (this._database) {
      return this._database;
    }
    this._database = this._createDatabaseClient();
    return this._database;
  }

  async set(username: string, password: string): Promise<void> {
    super.set(username, password);
    if (this._database) {
      await this._database.end();
      this._database = this._createDatabaseClient();
    }
  }

  /**
   * Validates the credentials. Returns a list of the available collections
   * if they are. If they are not, clears the username and password and
   * throws an exception.
   */
  async validate(): Promise<Collection[]> {
    try {
      const rows = await query.getAllCollections(this._kernel.database);
      return rows.map((row) => ({
        collectionID: row.CollectionID,
        collectionName: row.CollectionName
      }));
    } catch (err) {
      await this.clear();
      throw err;
    }
  }

  //// PRIVATE METHODS ////

  private _createDatabaseClient() {
    if (!this.username || !this.password)
      throw new UserError('No database credentials assigned');
    const config = this._kernel.databaseConfig;
    const pool = mysql.createPool({
      host: config.databaseHost,
      database: config.databaseName,
      port: config.databasePort,
      user: this.username,
      password: this.password
    });
    addTimeoutToPromisePool({ pool, seconds: CONNECTION_TIMEOUT_SECONDS });
    return pool;
  }
}
