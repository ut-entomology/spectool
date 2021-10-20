import knex, { Knex } from 'knex'

import { AppKernel } from './app_kernel'
import { Credentials } from './credentials'

export class DatabaseCredentials extends Credentials {

  private kernel: AppKernel
  private __database?: Knex

  constructor(kernel: AppKernel) {
    super(kernel.appName + " - database")
    this.kernel = kernel
  }

  get database(): Knex {
    if (this.__database)
      return this.__database
    this.__database = this.createDatabaseClient()
    return this.__database
  }

  getSavedUsername(): string {
    return this.kernel.prefs.databaseUsername
  }

  isSavingCredentials(): boolean {
    return this.kernel.prefs.saveDatabaseCredentials
  }

  async saveUsername(username: string): Promise<void> {
    const prefs = this.kernel.prefs
    prefs.databaseUsername = username
    await this.kernel.savePrefs(prefs)
  }

  async setCredentials(username: string, password: string): Promise<void> {
    await super.setCredentials(username, password)
    if (this.__database)
      this.__database = this.createDatabaseClient()
  }

  //// PRIVATE METHODS ////

  private createDatabaseClient(): Knex {
    const prefs = this.kernel.prefs
    return knex({
      client: 'mysql2',
      connection: {
        host: prefs.databaseDomain,
        database: prefs.databaseName,
        port: prefs.databasePort,
        user: this.username,
        password: this.password,
      }
    })
  }
}
