import { Platform } from "./app-util/platform";
import { PreferencesFile } from "./app-util/prefs_file";
import { SavableCredentials } from "./app-util/savable_creds";

// Testing and debugging is set up for Jest Runner with VS Code.

export class TestPrefs {
  databaseHost = "localhost";
  databasePort = 3306;
  databaseName = "specify_dev";
  databaseUsername: string = "tester";
}

export class TestPrefsFile extends PreferencesFile<TestPrefs> {
  constructor(platform: Platform) {
    super(platform, "test-config", "0.1.0", () => new TestPrefs());
  }
}

export class TestCredentials extends SavableCredentials {
  private prefsFile: TestPrefsFile;
  private prefs?: TestPrefs;

  constructor(appName: string, prefsFile: TestPrefsFile) {
    super(appName, "test");
    this.prefsFile = prefsFile;
  }

  async init(): Promise<void> {
    this.prefs = await this.prefsFile.load(); // init() depends on prefs
    await super.init();
  }

  protected getSavedUsername(): string {
    return this.prefs!.databaseUsername;
  }

  protected isSavingCredentials(): boolean {
    return true;
  }

  protected async saveUsername(username: string): Promise<void> {
    this.prefs!.databaseUsername = username;
    await this.prefsFile.save(this.prefs!);
  }
}
