import knex, { Knex } from 'knex';

import { AppKernel } from './app_kernel';
import { SavableCredentials } from '../app-util/savable_creds';
import { Collection } from '../shared/schema/collection';

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
   * Tests the credentials to make sure they are valid.
   * Throws an exception if they are not.
   */
  async test(db: Knex): Promise<void> {
    const rows = await db.select('CollectionName').from<Collection>('collection');
    if (rows.length == 0) {
      throw Error('No collections found');
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
