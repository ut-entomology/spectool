import knex, { Knex } from 'knex'

import { AppKernel } from './app_kernel'

class Credentials {

  private kernel: AppKernel

  constructor(kernel: AppKernel) {
    this.kernel = kernel
  }

  async loginToDatabase(username: string, password: string): Promise<Knex> {
    let db: Knex
    try {
      db = knex({
        client: 'mysql2',
        connection: {
          host: this.kernel.prefs.databaseDomain,
          database: this.kernel.prefs.databaseName,
          port: this.kernel.prefs.databasePort,
          user: username,
          password: password,
        }
      })
    }
    catch (err) {
    }
  }
}
