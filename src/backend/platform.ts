import { promises as fsp } from 'fs'
import * as path from 'path'

import { ConfigError } from './errors'
import { hasErrorCode } from './util'

/**
 * Platform is a class providing access to the desktop environment.
 */

export class Platform {

  readonly userHomeDir: string
  readonly userCacheDir: string
  readonly userConfigDir: string

  /**
   * Constructs a Platform instance from the name of the application
   * expressed to that it may be used as a directory name.
   * @throws ConfigError when a required environment variable is not set
   */
  constructor(appDirName: string) {

    // Determine the app directories as a function of operating system.

    switch (process.platform) {

      // MacOS
      case "darwin":
        this.userHomeDir = this._nonEmptyVar("HOME")
        this.userConfigDir = path.join(this.userHomeDir, "Library/Application Support", appDirName)
        this.userCacheDir = path.join(this.userHomeDir, "Library/Caches", appDirName)
        break

      // Windows (including 64-bit)
      case "win32":
        this.userHomeDir = this._nonEmptyVar("USERPROFILE")
        this.userConfigDir = path.join(this._nonEmptyVar("AppData"), appDirName)
        this.userCacheDir = path.join(this._nonEmptyVar("LocalAppData"), appDirName)
        break

      // UNIX/Linux
      default:
        this.userHomeDir = this._nonEmptyVar("HOME")
        this.userConfigDir = process.env["XDG_CONFIG_HOME"] || path.join(
          this.userHomeDir, ".config", appDirName)
        this.userCacheDir = process.env["XDG_CACHE_HOME"] || path.join(
          this.userHomeDir, ".cache", appDirName)
    }
  }

  /**
   * Remove the given user directory and all contained files.
   * Does not throw an error if the directory does not exist.
   */
  async dropUserDir(userDir: string): Promise<void> {
    try {
      const files = await fsp.readdir(userDir)
      for (const fileName of files) {
        await fsp.unlink(path.join(userDir, fileName))
      }
      await fsp.rmdir(userDir)
    }
    catch (err) {
      if (!hasErrorCode(err) || err.code != "ENOENT")
        throw err
    }
  }

  /**
   * Remove the given user file. Does not throw an error if the directory or
   * file does not exist.
   */
  async dropUserFile(userDir: string, fileName: string): Promise<void> {
    try {
      await fsp.unlink(path.join(userDir, fileName))
    }
    catch (err) {
      if (!hasErrorCode(err) || err.code != "ENOENT")
        throw err
    }
  }

  /**
   * Returns the date on which the given user file was last written.
   */
  async getUserFileDate(userDir: string, fileName: string): Promise<Date | null> {
    const filePath = path.join(userDir, fileName)
    try {
      const stats = await fsp.stat(filePath)
      return stats.mtime
    }
    catch (err) {
      if (hasErrorCode(err) && err.code == "ENOENT")
        return null
      throw err
    }
  }

  /**
   * Returns text from the given user file. Returns "" if the file is
   * empty or if the file is not present.
   */
  async readTextUserFile(userDir: string, fileName: string): Promise<string> {
    const filePath = path.join(userDir, fileName)
    try {
      return await fsp.readFile(filePath, { encoding: "utf8" })
    }
    catch (err) {
      if (hasErrorCode(err) && err.code == "ENOENT")
        return ""
      throw err
    }
  }

  /**
   * Writes text to the given user file, first creating the user
   * directory if it does not exist.
   */
  async writeTextUserFile(userDir: string, fileName: string, text: string):
    Promise<void> {

    const filePath = path.join(userDir, fileName)
    try {
      await fsp.access(filePath)
    }
    catch (err) {
      await fsp.mkdir(userDir).catch(e => e)
    }
    await fsp.writeFile(filePath, text)
  }

  /**
   * Require that an environment variable be assigned.
   * @throws ConfigError when the variable has no value
   */
  private _nonEmptyVar(var_name: string): string {
    const env_var = process.env[var_name]
    if (!env_var)
      throw new ConfigError(`Enviroment variable '${var_name}' not defined`)
    return env_var
  }
}
