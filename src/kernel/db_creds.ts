import knex, { Knex } from 'knex';

import { AppKernel } from './app_kernel';
import { SavableCredentials } from '../app-util/savable_creds';
import { SpecCollection } from '../shared/schema';

const CONNECTION_TIMEOUT_MILLIS = 15000;

export class DatabaseCredentials extends SavableCredentials {
  private _kernel: AppKernel;
  private _database?: Knex;

  constructor(kernel: AppKernel) {
    super(kernel.platform.appName, 'database');
    this._kernel = kernel;
  }

  async clear(): Promise<void> {
    await super.clear();
    if (this._database) {
      await this._database.destroy();
    }
    this._database = undefined;
  }

  connect(): Knex {
    if (this._database) {
      return this._database;
    }
    this._database = this._createDatabaseClient();
    return this._database;
  }

  async set(username: string, password: string): Promise<void> {
    super.set(username, password);
    if (this._database) {
      await this._database.destroy();
      this._database = this._createDatabaseClient();
    }
  }

  /**
   * Validates the credentials. Returns a list of the available collections
   * if they are. If they are not, clears the username and password and
   * throws an exception.
   */
  async validate(): Promise<SpecCollection[]> {
    try {
      const rows = await this._kernel.database
        .select('collectionID', 'collectionName')
        .from<SpecCollection>('collection');
      return rows.map((row) => ({
        collectionID: row.collectionID,
        collectionName: row.collectionName
      }));
    } catch (err) {
      await this.clear();
      throw err;
    }
  }

  //// PRIVATE METHODS ////

  private _createDatabaseClient(): Knex {
    if (!this.username || !this.password)
      throw Error('No database credentials assigned');
    const config = this._kernel.databaseConfig;
    return knex({
      client: 'mysql2',
      connection: {
        host: config.databaseHost,
        database: config.databaseName,
        port: config.databasePort,
        user: this.username,
        password: this.password
      },
      acquireConnectionTimeout: CONNECTION_TIMEOUT_MILLIS
    });
  }
}
