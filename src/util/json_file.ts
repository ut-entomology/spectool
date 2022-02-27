import { promises as fsp } from 'fs';
import * as path from 'path';

import { fileNotFound } from './errors';

/**
 * JsonFile is a class that manages a JSON file.
 * @param T Type for data in JSON file
 */

export class JsonFile<T> {
  private filePath: string;
  private version: string;
  private getDefaultJson: () => T;

  /**
   * Construct a proxy for a JSON file.
   * @param baseFolder Path to the folder containing `filename`
   * @param filename Name of the JSON file, including '.json' suffix, or
   *    any path to the file relative to `baseFolder`
   * @param version Version of the JSON file, identifying the data type `T`
   * @param getDefaultJson Function returning the default data to use when
   *    there is no file or when the existing file has a different version.
   */

  constructor(
    baseFolder: string,
    filename: string,
    version: string,
    getDefaultJson: () => T
  ) {
    if (!filename.endsWith('.json')) {
      throw Error("JSON file is missing suffix '.json'");
    }
    this.filePath = path.join(baseFolder, filename);
    this.version = version;
    this.getDefaultJson = getDefaultJson;
  }

  /**
   * Loads the JSON data and returns it as an object of type `T`. If the
   * old file has a different version, the method first calls `update` to
   * update the data and then saves the updated JSON to the file. If
   * no file yet exists, returns the default data without saving them.
   */
  async load(): Promise<T> {
    let jsonString: string = '';
    try {
      jsonString = await fsp.readFile(this.filePath, { encoding: 'utf8' });
    } catch (err) {
      if (!fileNotFound(err)) throw err;
    }

    if (jsonString === '') {
      return this.getDefaultJson();
    }
    let { version, data } = JSON.parse(jsonString);
    if (version !== this.version) {
      data = this.update(version, data);
      await this.save(data);
    }
    return data;
  }

  /**
   * Saves the provided data to the JSON file, indicating that
   * the data has the current JSON file version.
   * @param data Data to save
   */
  async save(data: T): Promise<void> {
    const jsonString = JSON.stringify({ version: this.version, data });
    await fsp.writeFile(this.filePath, jsonString);
  }

  /**
   * Delete the JSON file.
   */

  async drop(): Promise<void> {
    try {
      await fsp.unlink(this.filePath);
    } catch (err) {
      if (!fileNotFound(err)) throw err;
    }
  }

  //// PROTECTED METHODS ////

  /**
   * Converts an old version of the data file to the current version,
   * returning the converted data. Returns the default data by default,
   * but subclasses may override this behavior.
   * @param _oldVersion Version of the existing JSON file
   * @param _oldData Existing data as an object literal (no class info)
   */
  protected update(_oldVersion: string, _oldData: any): T {
    return this.getDefaultJson();
  }
}
