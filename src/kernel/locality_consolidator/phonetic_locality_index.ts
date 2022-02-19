import { CachedLocality } from './cached_locality';

export interface PhoneticLocalityIndex {
  /**
   * Adds the provided locality to the index, indexing the locality by the
   * phonetic codes it contains.
   */
  addLocality(locality: CachedLocality): Promise<void>;

  /**
   * Adds the provided phonetic series to the index. The order of
   * phonetic encodings in the phonetic series does not matter.
   */
  addPhoneticSeries(phoneticSeries: string[]): void;

  /**
   * Returns the IDs of the localities containing the given phonetic code.
   */
  getLocalityIDs(phoneticCode: string): Promise<number[]>;

  /**
   * Returns all of the phonetic series that contain the given phonetic code,
   * representing each phonetic series as a list of phonetic codes. The
   * order of phonetic codes in the phonetic series is not meaningful.
   */
  getPhoneticSeriesSynonyms(phoneticCode: string): Promise<string[][]>;

  /**
   * Removes the indicated locality from the index.
   */
  removeLocality(locality: CachedLocality): Promise<void>;

  /**
   * Removes the indicated phonetic series from the index. Primarily useful
   * for when the users changes their mind about using a synonym. The order
   * of phonetic codes in the provided series must match their order when
   * they were added, which is also the order provided on retrieval.
   */
  removePhoneticSeries(phoneticSeriesStr: string): void;
}
