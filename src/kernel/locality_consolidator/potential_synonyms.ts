/**
 * Structure representing a stored synonym.
 */
export interface StoredSynonym {
  // occurrence-ordered word series user provided to create the synonym
  originalWordSeries: string;
  // sorted phonetic series for the original word series
  phoneticSeries: string;
}

/**
 * Base class for synonyms among locality word series.
 */
export abstract class PotentialSynonymsStore {
  /**
   * Adds a synonym to the storage, where `synonym1` is equivalent to
   * `synonym2`. Argument order does not matter.
   */
  addSynonym(synonym1: StoredSynonym, synonym2: StoredSynonym): void {
    // Make occurrences of series1 map to series2.
    this._addHalfSynonym(synonym1.phoneticSeries, synonym2);
    // Make occurrences of series2 map to series1.
    this._addHalfSynonym(synonym2.phoneticSeries, synonym1);
  }

  /**
   * Returns the synonyms in which the provided phonetic series participates, or
   * null if no synonyms are associated with the phonetic series. The returned
   * value excludes the stored synonym having the provided phonetic series.
   */
  abstract getSynonyms(phoneticSeries: string): StoredSynonym[] | null;

  /**
   * Removes a synonym from the storage, where `synonym1` is no longer to be
   * treated as equivalent to `synonym2`. Argument order does not matter.
   */
  removeSynonym(synonym1: StoredSynonym, synonym2: StoredSynonym): void {
    // Remove mapping of series1 to series2.
    this._removeHalfSynonym(synonym1.phoneticSeries, synonym2);
    // Remove mapping of series2 to series1.
    this._removeHalfSynonym(synonym2.phoneticSeries, synonym1);
  }

  /**
   * Assigns the provided set of synonyms to a given phonetic series. This method
   * should NOT also provide reverse associations, as the caller does that.
   */
  protected abstract _setSynonyms(
    phoneticSeries: string,
    synonyms: StoredSynonym[]
  ): void;

  /**
   * Indexes the provided `indexedSynonym` by the provided phonetic series index.
   */
  private _addHalfSynonym(phoneticSeriesIndex: string, indexedSynonym: StoredSynonym) {
    let synonyms = this.getSynonyms(phoneticSeriesIndex);
    if (synonyms === null) {
      synonyms = [];
    }
    for (const synonym of synonyms) {
      if (synonym.originalWordSeries == indexedSynonym.originalWordSeries) {
        return; // this half of the synonym is already present
      }
    }
    synonyms.push(indexedSynonym);
    this._setSynonyms(phoneticSeriesIndex, synonyms);
  }

  /**
   * Removes the provided `indexedSynonym` from the provided phonetic series index.
   */
  private _removeHalfSynonym(
    phoneticSeriesIndex: string,
    indexedSynonym: StoredSynonym
  ) {
    const synonyms = this.getSynonyms(phoneticSeriesIndex);
    if (synonyms === null) {
      return; // this half of the synonym is not present
    }
    for (let i = 0; i < synonyms.length; ++i) {
      if (synonyms[i].originalWordSeries == indexedSynonym.originalWordSeries) {
        synonyms.splice(i, 1);
        this._setSynonyms(phoneticSeriesIndex, synonyms);
        return; // removed this half of synonym
      }
    }
    // if reaches here, this half of the synonym was not present
  }
}
