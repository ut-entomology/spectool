import { Platform } from './app-util/platform'
import { PreferencesFile } from './app-util/prefs_file';
import { SavableCredentials } from './app-util/savable_creds'

export class TestPrefs {
  databaseHost = "localhost"
  databasePort = 3306
  databaseName = "specify_dev"
  databaseUsername: string = "tester"
}

export class TestPrefsFile extends PreferencesFile<TestPrefs> {
  constructor(platform: Platform) {
    super(platform, "test", "0.1.0", () => new TestPrefs())
  }
}

export class TestCredentials extends SavableCredentials {

  private prefsFile: TestPrefsFile
  private prefs?: TestPrefs

  constructor(appName: string, prefsFile: TestPrefsFile) {
    super(appName, "test")
    this.prefsFile = prefsFile
  }

  async init(): Promise<void> {
    this.prefs = await this.prefsFile.load() // init() depends on prefs
    await super.init()
  }

  getSavedUsername(): string {
    return this.prefs!.databaseUsername
  }

  isSavingCredentials(): boolean {
    return true
  }

  async saveUsername(username: string): Promise<void> {
    this.prefs!.databaseUsername = username
    await this.prefsFile.save(this.prefs!)
  }
}
