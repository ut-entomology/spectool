import type { Platform } from '../../app-util/platform';
import { AppPrefs } from '../../shared/shared_app_prefs';
import { DatabaseConfig, DatabaseValues } from '../../shared/shared_db_config';
import type { SpecifyUser, Credentials } from '../../shared/shared_user';
import { PreferencesFile } from '../../app-util/prefs_file';
import type * as query from '../specify/queries';
import { DatabaseCredentials } from '../db_creds';
import { UserCredentials } from '../user_creds';
import { SpecifyApi } from '../specify_api';

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

  typecast(prefs: any) {
    return new AppPrefs(prefs);
  }
}

/**
 * AppPrefsFile manages the non-Electron user preferences.
 */
class DatabaseConfigFile extends PreferencesFile<DatabaseConfig> {
  constructor(platform: Platform, defaultDatabaseValues: DatabaseValues) {
    super(
      platform,
      'db-config',
      '0.1.0',
      () => new DatabaseConfig(defaultDatabaseValues)
    );
  }

  typecast(prefs: any) {
    return new DatabaseConfig(prefs);
  }
}

/**
 * AppKernel represents the portion of the application that can
 * be run either from within an Electron app or standalone via
 * an invocation of node.js. It provides context and globals.
 */
export class AppKernel {
  readonly platform: Platform;
  readonly appPrefsFile: AppPrefsFile;
  readonly databaseConfigFile: DatabaseConfigFile;
  readonly specifyApi: SpecifyApi;
  loggedInUser: SpecifyUser | null = null;

  private _appPrefs?: AppPrefs;
  private _databaseConfig?: DatabaseConfig;
  private _databaseCreds?: DatabaseCredentials;
  private _userCreds?: UserCredentials;

  /**
   * Constructs a kernel for the given application name. The name is
   * primarily used to create user directories for storing cached data,
   * app configuration and user preferences. The caller must call
   * `init()` after construction and prior to use.
   */
  constructor(platform: Platform, defaultDatabaseValues: DatabaseValues) {
    this.platform = platform;
    this.appPrefsFile = new AppPrefsFile(this.platform);
    this.databaseConfigFile = new DatabaseConfigFile(
      this.platform,
      defaultDatabaseValues
    );
    this.specifyApi = new SpecifyApi();
  }

  /**
   * Initializes the kernel from the available application cofiguration,
   * user preferences, and app-specific login credentials stored within the OS.
   */
  async init(): Promise<void> {
    this._appPrefs = new AppPrefs(await this.appPrefsFile.load());
    this._databaseConfig = await this.databaseConfigFile.load();
    this._databaseCreds = new DatabaseCredentials(this);
    this._userCreds = new UserCredentials(this);
    await this._databaseCreds.init();
    await this._userCreds.init();
  }

  /**
   * Returns a client for the configured Specify database.
   */
  get database(): query.DB {
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

  /**
   * Returns saved Database user credentials or null if none.
   */
  getSavedDatabaseCreds() {
    const databaseCreds = this._databaseCreds!;
    return databaseCreds.isSaved() ? databaseCreds.get() : null;
  }

  /**
   * Returns saved Specify user credentials or null if none.
   */
  getSavedUserCreds() {
    const userCreds = this._userCreds!;
    return userCreds.isSaved() ? userCreds.get() : null;
  }

  /**
   * Logs in the provided Specify user.
   */
  async loginUser(creds: Credentials, save: boolean) {
    const userCreds = this._userCreds!;
    await userCreds.set(creds.username, creds.password);
    this.loggedInUser = await userCreds.validate();
    if (save) {
      await userCreds.save();
      this.loggedInUser.saved = true;
    }
    return this.loggedInUser;
  }

  /**
   * Logs out the currently logged-in Specify user.
   */
  async logoutUser() {
    const kernel = this;
    const userCreds = this._userCreds!;
    await userCreds.clear().then(async () => {
      try {
        await userCreds.validate();
      } catch (err) {
        kernel.loggedInUser = null;
        return;
      }
      throw Error('Failed to log user out of Specify');
    });
  }

  /**
   * Releases resources associated with the kernel.
   */
  destroy() {
    this.database.end();
  }
}
