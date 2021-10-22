import knex, { Knex } from 'knex'

import { AppKernel } from './app_kernel'
import { SavableCredentials } from '../app-util/savable_creds'

export class DatabaseCredentials extends SavableCredentials {

  private kernel: AppKernel
  private __database?: Knex

  constructor(kernel: AppKernel) {
    super(kernel.appName, "database")
    this.kernel = kernel
  }

  get database(): Knex {
    if (this.__database)
      return this.__database
    this.__database = this.createDatabaseClient()
    return this.__database
  }

  protected getSavedUsername(): string {
    return this.kernel.prefs.databaseUsername
  }

  protected isSavingCredentials(): boolean {
    return this.kernel.prefs.saveDatabaseCredentials
  }

  protected async saveUsername(username: string): Promise<void> {
    const prefs = this.kernel.prefs
    prefs.databaseUsername = username
    await this.kernel.savePrefs(prefs)
  }

  async set(username: string, password: string): Promise<void> {
    await super.set(username, password)
    if (this.__database) {
      await this.__database.destroy()
      this.__database = this.createDatabaseClient()
    }
  }

  //// PRIVATE METHODS ////

  private createDatabaseClient(): Knex {
    if (!this.username || !this.password)
      throw Error("No database credentials assigned")
    const prefs = this.kernel.prefs
    return knex({
      client: 'mysql2',
      connection: {
        host: prefs.databaseHost,
        database: prefs.databaseName,
        port: prefs.databasePort,
        user: this.username,
        password: this.password,
      }
    })
  }
}
