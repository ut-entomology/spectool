import { Knex } from 'knex';

import { Platform } from '../app-util/platform';
import { AppPrefs } from '../shared/app_prefs';
import { DatabaseConfig } from '../shared/db_config';
import { PreferencesFile } from '../app-util/prefs_file';
import { DatabaseCredentials } from './db_creds';
import { Specify } from './specify';

// TODO: Can I move some of these globals to their own modules (and still test)?
// TODO: Can I move the kernel to a global (and still test)?
// I'm thinking that AppPrefsFile and DatabaseConfigFile get their own modules.

/**
 * AppPrefsFile manages the non-Electron user application preferences.
 */
class AppPrefsFile extends PreferencesFile<AppPrefs> {
  constructor(platform: Platform) {
    super(platform, 'app-prefs', '0.1.0', () => new AppPrefs());
  }
}

/**
 * AppPrefsFile manages the non-Electron user preferences.
 */
class DatabaseConfigFile extends PreferencesFile<DatabaseConfig> {
  constructor(platform: Platform) {
    super(platform, 'db-config', '0.1.0', () => new DatabaseConfig());
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
  readonly databaseConfigFile: DatabaseConfigFile;
  readonly specify: Specify;

  private _appPrefs?: AppPrefs;
  private _databaseConfig?: DatabaseConfig;
  private _databaseCreds?: DatabaseCredentials;

  /**
   * Constructs a kernel for the given application name. The name is
   * primarily used to create user directories for storing cached data,
   * app configuration and user preferences. The caller must call
   * `init()` after construction and prior to use.
   */
  constructor(appName: string) {
    this.appName = appName;
    this.platform = new Platform(appName);
    this.appPrefsFile = new AppPrefsFile(this.platform);
    this.databaseConfigFile = new DatabaseConfigFile(this.platform);
    this.specify = new Specify();
  }

  /**
   * Initializes the kernel from the available application cofiguration,
   * user preferences, and app-specific login credentials stored within the OS.
   */
  async init(): Promise<void> {
    this._appPrefs = new AppPrefs(await this.appPrefsFile.load());
    this._databaseConfig = new DatabaseConfig(await this.databaseConfigFile.load());
    this._databaseCreds = new DatabaseCredentials(this);
    await this._databaseCreds.init();
  }

  /**
   * Returns a client for the configured Specify database.
   */
  get database(): Knex {
    return this.databaseCreds!.connect();
  }

  /**
   * Returns a client for managing the database credentials.
   */
  get databaseCreds(): DatabaseCredentials {
    return this._databaseCreds!;
  }

  /**
   * Returns the applications preferences.
   */
  get appPrefs(): AppPrefs {
    return this._appPrefs!;
  }

  /**
   * Saves the provided preferences to the app's user directory.
   */
  async saveAppPrefs(prefs: AppPrefs): Promise<void> {
    this._appPrefs = prefs;
    await this.appPrefsFile.save(prefs);
  }

  /**
   * Erases the app's user preferences from the file system.
   */
  async dropAppPrefs(): Promise<void> {
    await this.appPrefsFile.drop();
  }

  /**
   * Returns the database configuration.
   */
  get databaseConfig(): DatabaseConfig {
    return this._databaseConfig!;
  }

  /**
   * Saves the provided DB config to the app's user directory.
   */
  async saveDatabaseConfig(config: DatabaseConfig): Promise<void> {
    this._databaseConfig = config;
    await this.databaseConfigFile.save(config);
  }

  /**
   * Erases the database configuration from the file system.
   */
  async dropDatabaseConfig(): Promise<void> {
    await this.databaseConfigFile.drop();
  }
}
