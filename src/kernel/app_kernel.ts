import knex, { Knex } from 'knex'
import * as keytar from 'keytar'

import { Platform } from '../app-util/platform'
import { AppPrefs } from '../shared/app_prefs'
import { PreferencesFile } from "../app-util/prefs_file";

class AppPrefsFile extends PreferencesFile<AppPrefs> {
  constructor(platform: Platform) {
    super(platform, "prefs", "0.1.0", new AppPrefs())
  }
}

export class AppKernel {

  readonly appName: string
  readonly platform: Platform
  readonly appPrefsFile: AppPrefsFile

  private __prefs: AppPrefs
  private __database?: Knex
  private databaseUsername?: string
  private databasePassword?: string
  private databaseService: string

  constructor(appName: string) {
    this.appName = appName
    this.platform = new Platform(appName)
    this.appPrefsFile = new AppPrefsFile(this.platform)
    this.__prefs = new AppPrefs() // make TS happy
    this.databaseService = appName + " - database"
  }

  async init(): Promise<void> {
    this.__prefs = await this.appPrefsFile.load()

    if (this.__prefs.saveDatabaseCredentials && this.__prefs.databaseUsername) {
      const storedPassword = await keytar.getPassword(
          this.databaseService, this.__prefs.databaseUsername)
      if (storedPassword != null) {
        this.databaseUsername = this.__prefs.databaseUsername
        this.databasePassword = storedPassword
      }
      else {
        this.__prefs.databaseUsername = ""
        await this.savePrefs(this.__prefs)
      }
    } else {
      const creds = await keytar.findCredentials(this.databaseService)
      for (const cred of creds)
        await keytar.deletePassword(this.databaseService, cred.account)
      this.databaseUsername = undefined
    }
  }

  get database(): Knex {
    if (this.__database)
      return this.__database
    this.__database = this.createDatabaseClient()
    return this.__database
  }

  getDatabaseCredentials(): [string, string] | null {
    if (this.databaseUsername && this.databasePassword)
      return [this.databaseUsername, this.databasePassword]
    return null
  }

  get prefs(): AppPrefs {
    return this.__prefs
  }

  async savePrefs(prefs: AppPrefs): Promise<void> {
    this.__prefs = prefs
    await this.appPrefsFile.save(prefs)
  }

  async setDatabaseCredentials(username: string, password: string): Promise<void> {
    this.databaseUsername = username
    this.databasePassword = password

    if (this.__prefs.saveDatabaseCredentials) {
      this.__prefs.databaseUsername = username
      await keytar.setPassword(this.databaseService, username, password)
    } else {
      this.__prefs.databaseUsername = ""
      await keytar.deletePassword(this.databaseService, username) // ignore failure
    }
    await this.savePrefs(this.__prefs)

    if (this.__database)
      this.__database = this.createDatabaseClient()
  }

  //// PRIVATE METHODS ////

  private createDatabaseClient(): Knex {
    return knex({
      client: 'mysql2',
      connection: {
        host: this.prefs.databaseDomain,
        database: this.prefs.databaseName,
        port: this.prefs.databasePort,
        user: this.databaseUsername,
        password: this.databasePassword,
      }
    })
  }
}
