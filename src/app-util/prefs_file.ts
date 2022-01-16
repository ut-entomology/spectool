import type { Platform } from './platform';

/**
 * Preferences is a class that manages a JSON application preferences file.
 * @param T Type containing all user preferences
 */

export abstract class PreferencesFile<T> {
  private platform: Platform;
  private filename: string;
  private version: string;
  private getDefaultPrefs: () => T;

  /**
   * Construct a proxy for a preferences file.
   * @param platform Platform for managing user files
   * @param filename Name of the preferences file, with no file type suffix
   * @param version Version of the preferences file, identifying the data type `T`
   * @param getDefaultPrefs Function returning the default preferences to use when
   *    there is no preferences file or when the existing preference file has a
   *    different version.
   */

  constructor(
    platform: Platform,
    filename: string,
    version: string,
    getDefaultPrefs: () => T
  ) {
    if (filename.indexOf('.') > 0)
      throw Error("Preferences file can't include the file type suffix");

    this.platform = platform;
    this.filename = filename + '.json';
    this.version = version;
    this.getDefaultPrefs = getDefaultPrefs;
  }

  /**
   * Loads the user preferences and returns them as an object of type `T`. If the
   * old preferences have a different version, the method first calls `update` to
   * update the preferences and then saves the updated preferences to the file. If
   * no preferences yet exist, returns the default preferences without saving them.
   */
  async load(): Promise<T> {
    const jsonString = await this.platform.readTextUserFile(
      this.platform.userConfigDir,
      this.filename
    );
    if (jsonString === '') {
      return this.getDefaultPrefs();
    }
    let { version, prefs } = JSON.parse(jsonString);
    if (version !== this.version) {
      prefs = this.update(version, prefs);
      await this.save(prefs);
    }
    return this.typecast(prefs);
  }

  /**
   * Saves the provided preferences to the preferences file, indicating that
   * they have the current preferences file version.
   * @param prefs Preferences to save
   */
  async save(prefs: T): Promise<void> {
    const jsonString = JSON.stringify({ version: this.version, prefs });
    await this.platform.writeTextUserFile(
      this.platform.userConfigDir,
      this.filename,
      jsonString
    );
  }

  /**
   * Delete the preferences file.
   */

  async drop(): Promise<void> {
    await this.platform.dropUserFile(this.platform.userConfigDir, this.filename);
  }

  /**
   * Typecasts 'any' type to type T for return.
   */

  abstract typecast(prefs: any): T;

  //// PROTECTED METHODS ////

  /**
   * Converts an old version of the preferences to the current version,
   * returning the converted preferences. Returns the default preferences
   * by default, but subclasses may override this behavior.
   * @param _oldVersion Version of the existing preferences file
   * @param _oldPrefs Existing preferences as an object literal (no class info)
   */
  protected update(_oldVersion: string, _oldPrefs: any): T {
    return this.getDefaultPrefs();
  }
}
