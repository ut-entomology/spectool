import { Knex } from 'knex';

import { Platform } from '../app-util/platform';
import { AppPrefs } from '../shared/app_prefs';
import { PreferencesFile } from '../app-util/prefs_file';
import { DatabaseCredentials } from './db_creds';

// TODO: Need to reconcile the fact that I'd like this name here but
// Electron pulls the name out of package.json, which can't have spaces.
// Consequently, my code and Electron are using different user directories.
export const APP_NAME = 'UT SpecTool';

/**
 * AppPrefsFile manages the non-Electron user preferences.
 */
class AppPrefsFile extends PreferencesFile<AppPrefs> {
  constructor(platform: Platform) {
    super(platform, 'prefs-config', '0.1.0', () => new AppPrefs());
  }
}

/**
 * AppKernel represents the portion of the application that can
 * be run either from within an Electron app or standalone via
 * an invocation of node.js. It provides context and globals.
 */
export class AppKernel {
  readonly appName: string;
  readonly platform: Platform;
  readonly appPrefsFile: AppPrefsFile;

  private __prefs?: AppPrefs;
  private __databaseCreds?: DatabaseCredentials;

  /**
   * Constructs a kernel for the given application name. The name is
   * primarily used to create user directories for storing cached data,
   * app configuration and user preferences. The caller must call
   * `init()` after construction and prior to use.
   */
  constructor(appName: string = APP_NAME) {
    this.appName = appName;
    this.platform = new Platform(appName);
    this.appPrefsFile = new AppPrefsFile(this.platform);
  }

  /**
   * Initializes the kernel from the available application cofiguration,
   * user preferences, and app-specific login credentials stored within the OS.
   */
  async init(): Promise<void> {
    this.__prefs = await this.appPrefsFile.load();
    this.__databaseCreds = new DatabaseCredentials(this);
    await this.__databaseCreds.init();
  }

  /**
   * Returns a client for the configured Specify database.
   */
  get database(): Knex {
    return this.databaseCreds!.database;
  }

  /**
   * Returns a client for managing the database credentials.
   */
  get databaseCreds(): DatabaseCredentials {
    return this.__databaseCreds!;
  }

  /**
   * Returns the applications preferences, including its configuration.
   */
  get prefs(): AppPrefs {
    return this.__prefs!;
  }

  /**
   * Saves the provided preferences to the app's user directory.
   */
  async savePrefs(prefs: AppPrefs): Promise<void> {
    this.__prefs = prefs;
    await this.appPrefsFile.save(prefs);
  }

  /**
   * Erases the app's user preferences from the file system.
   */
  async dropPrefs(): Promise<void> {
    await this.appPrefsFile.drop();
  }
}
