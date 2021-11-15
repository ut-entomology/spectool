import knex, { Knex } from 'knex';

import { AppKernel } from './app_kernel';
import { SavableCredentials } from '../app-util/savable_creds';
import { SpecCollection } from '../shared/schema';

export class DatabaseCredentials extends SavableCredentials {
  private kernel: AppKernel;
  private __database?: Knex;

  constructor(kernel: AppKernel) {
    super(kernel.appName, 'database');
    this.kernel = kernel;
  }

  async clear(): Promise<void> {
    await super.clear();
    if (this.__database) {
      await this.__database.destroy();
    }
    this.__database = undefined;
  }

  connect(): Knex {
    if (this.__database) {
      return this.__database;
    }
    this.__database = this.createDatabaseClient();
    return this.__database;
  }

  async set(username: string, password: string): Promise<void> {
    super.set(username, password);
    if (this.__database) {
      await this.__database.destroy();
      this.__database = this.createDatabaseClient();
    }
  }

  /**
   * Validates the credentials. Returns a list of the available collections
   * if they are. If they are not, clears the username and password and
   * throws an exception.
   */
  async validate(): Promise<SpecCollection[]> {
    try {
      const rows = await this.kernel.database
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

  private createDatabaseClient(): Knex {
    if (!this.username || !this.password)
      throw Error('No database credentials assigned');
    const prefs = this.kernel.prefs;
    return knex({
      client: 'mysql2',
      connection: {
        host: prefs.databaseHost,
        database: prefs.databaseName,
        port: prefs.databasePort,
        user: this.username,
        password: this.password
      }
    });
  }
}
