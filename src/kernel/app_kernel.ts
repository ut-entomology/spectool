import { Knex } from 'knex'

import { Platform } from '../app-util/platform'
import { AppPrefs } from '../shared/app_prefs'
import { PreferencesFile } from '../app-util/prefs_file';
import { DatabaseCredentials } from './db_creds'

export const APP_NAME = "UT SpecTool"

class AppPrefsFile extends PreferencesFile<AppPrefs> {
  constructor(platform: Platform) {
    super(platform, "prefs", "0.1.0", () => new AppPrefs())
  }
}

export class AppKernel {

  readonly appName: string
  readonly platform: Platform
  readonly appPrefsFile: AppPrefsFile

  private __prefs?: AppPrefs
  private __databaseCreds?: DatabaseCredentials

  constructor(appName: string = APP_NAME) {
    this.appName = appName
    this.platform = new Platform(appName)
    this.appPrefsFile = new AppPrefsFile(this.platform)
  }

  async init(): Promise<void> {
    this.__prefs = await this.appPrefsFile.load()
    this.__databaseCreds = new DatabaseCredentials(this)
    await this.__databaseCreds.init()
  }

  get database(): Knex {
    return this.databaseCreds!.database
  }

  get databaseCreds(): DatabaseCredentials {
    return this.__databaseCreds!
  }

  get prefs(): AppPrefs {
    return this.__prefs!
  }

  async savePrefs(prefs: AppPrefs): Promise<void> {
    this.__prefs = prefs
    await this.appPrefsFile.save(prefs)
  }

  async dropPrefs(): Promise<void> {
    await this.appPrefsFile.drop()
  }
}
