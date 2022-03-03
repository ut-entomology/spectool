/**
 * Index of localities and phonetic series by component phonetic codes.
 */

import type { CachedLocality } from './cached_locality';

export interface PhoneticCodeIndexEntry {
  localityIDs: number[];
  sortedPhoneticSeries: string[]; // sorted
}

export abstract class PhoneticCodeIndex {
  /**
   * Adds the provided locality to the index, indexing the locality by the
   * phonetic codes it contains. Ignores the locality if it has no phonetic codes.
   */
  async addLocality(locality: CachedLocality): Promise<void> {
    if (locality.phoneticCodes) {
      const foundCodes: Record<string, boolean> = {};
      for (const phoneticCode of locality.phoneticCodes) {
        if (!foundCodes[phoneticCode]) {
          const entry = this._getOrCreateIndexEntry(phoneticCode);
          if (!entry.localityIDs.includes(locality.localityID)) {
            entry.localityIDs.push(locality.localityID);
            this._setIndexEntry(phoneticCode, entry);
          }
          foundCodes[phoneticCode] = true;
        }
      }
    }
  }

  /**
   * Adds the provided sorted phonetic series to the index.
   */
  async addPhoneticSeriesSynonym(sortedPhoneticSeries: string): Promise<void> {
    for (const phoneticCode of sortedPhoneticSeries.split(' ')) {
      const entry = this._getOrCreateIndexEntry(phoneticCode);
      if (!entry.sortedPhoneticSeries.includes(sortedPhoneticSeries)) {
        entry.sortedPhoneticSeries.push(sortedPhoneticSeries);
        this._setIndexEntry(phoneticCode, entry);
      }
    }
  }

  /**
   * Returns the IDs of the localities containing the given phonetic code, or
   * null if no localities contain the phonetic code.
   */
  async getLocalityIDs(phoneticCode: string): Promise<number[] | null> {
    const entry = this._getIndexEntry(phoneticCode);
    if (!entry) return null;
    return entry.localityIDs;
  }

  /**
   * Returns all of the sorted phonetic series synonyms that contain the given
   * phonetic code, or null if no synonyms are found for the code.
   */
  async getPhoneticSeriesSynonyms(phoneticCode: string): Promise<string[] | null> {
    const entry = this._getIndexEntry(phoneticCode);
    if (!entry) return null;
    return entry.sortedPhoneticSeries;
  }

  /**
   * Removes the indicated locality from the index. Ignores the locality if it
   * has no phonetic codes.
   */
  async removeLocality(locality: CachedLocality): Promise<void> {
    if (locality.phoneticCodes) {
      const removedCodes: Record<string, boolean> = {};
      for (const phoneticCode of locality.phoneticCodes) {
        if (!removedCodes[phoneticCode]) {
          const entry = this._getIndexEntry(phoneticCode);
          if (entry) {
            const idIndex = entry.localityIDs.indexOf(locality.localityID);
            if (idIndex >= 0) {
              entry.localityIDs.splice(idIndex, 1);
              this._setIndexEntry(phoneticCode, entry);
            }
          }
          removedCodes[phoneticCode] = true;
        }
      }
    }
  }

  /**
   * Removes the indicated phonetic series from the index. Primarily useful
   * for when the users changes their mind about using a synonym.
   */
  async removePhoneticSeriesSynonym(sortedPhoneticSeries: string): Promise<void> {
    for (const phoneticCode of sortedPhoneticSeries.split(' ')) {
      const entry = this._getIndexEntry(phoneticCode);
      if (entry) {
        const seriesIndex = entry.sortedPhoneticSeries.indexOf(sortedPhoneticSeries);
        if (seriesIndex >= 0) {
          entry.sortedPhoneticSeries.splice(seriesIndex, 1);
          this._setIndexEntry(phoneticCode, entry);
        }
      }
    }
  }

  protected abstract _getIndexEntry(
    phoneticCode: string
  ): PhoneticCodeIndexEntry | null;

  // should remove the entry when it goes empty
  protected abstract _setIndexEntry(
    phoneticCode: string,
    entry: PhoneticCodeIndexEntry
  ): void;

  private _getOrCreateIndexEntry(phoneticCode: string): PhoneticCodeIndexEntry {
    const entry = this._getIndexEntry(phoneticCode);
    if (entry) return entry;
    return {
      localityIDs: [],
      sortedPhoneticSeries: []
    };
  }
}
