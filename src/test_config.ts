import { Platform } from './app-util/platform';
import { PreferencesFile } from './app-util/prefs_file';
import { SavableCredentials } from './app-util/savable_creds';
import { DatabaseValues } from './shared/db_config';

// Testing and debugging is set up for Jest Runner with VS Code.

export class TestPrefs implements DatabaseValues {
  // Default values when setting up test environment
  databaseHost = 'localhost';
  databasePort = 3306;
  databaseName = 'specify_dev';
}

export class TestPrefsFile extends PreferencesFile<TestPrefs> {
  constructor(platform: Platform) {
    super(platform, 'test-config', '0.1.0', () => new TestPrefs());
  }

  typecast(prefs: any) {
    return prefs as TestPrefs;
  }
}

export class TestCredentials extends SavableCredentials {
  constructor(appName: string) {
    super(appName, 'test');
  }
}
