/**
 * Storage for tracking synonymous phonetic encodings of words fouund
 * in localities. Word series are treated as potentially synonymous if
 * sorts of their phonetic encodings are identical.
 */

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
    // Make occurrences of synonym1 map to synonym2.
    this._addHalfSynonym(synonym1.phoneticSeries, synonym2);
    // Make occurrences of synonym2 map to synonym1.
    this._addHalfSynonym(synonym2.phoneticSeries, synonym1);
  }

  /**
   * Returns all synonymous phonetic series of the provided phonetic series,
   * including transitively-reached synonymous series, or null if there are
   * none. The returned value excludes the provided phonetic series, because
   * that phonetic series is otherwise captured as an equivalent word series.
   */
  getSynonymousSeries(phoneticSeries: string): string[] | null {
    const synonymousSeries: string[] = [];
    this._collectSynonymousSeries(
      synonymousSeries,
      phoneticSeries,
      this._getSynonymList(phoneticSeries)
    );
    return synonymousSeries.length == 0 ? null : synonymousSeries;
  }

  /**
   * Removes a prevoiusly-declared synonym from the storage, where `synonym1`
   * is no longer to be treated as equivalent to `synonym2`. Argument order
   * does not matter. Cannot be used to remove transitive synonymies.
   */
  removeSynonym(synonym1: StoredSynonym, synonym2: StoredSynonym): void {
    // Remove mapping of synonym1 to synonym2.
    this._removeHalfSynonym(synonym1.phoneticSeries, synonym2);
    // Remove mapping of synonym2 to synonym1.
    this._removeHalfSynonym(synonym2.phoneticSeries, synonym1);
  }

  /**
   * Returns the synonyms in which the provided phonetic series participates, or
   * null if no synonyms are associated with the phonetic series. The returned
   * value excludes the stored synonym having the provided phonetic series.
   */
  protected abstract _getSynonymList(phoneticSeries: string): StoredSynonym[] | null;

  /**
   * Assigns the provided set of synonyms to a given phonetic series. This method
   * should NOT also provide reverse associations, as the caller does that.
   */
  protected abstract _setSynonymList(
    phoneticSeries: string,
    synonyms: StoredSynonym[]
  ): void;

  /**
   * Indexes the provided `indexedSynonym` by the provided phonetic series index.
   */
  private _addHalfSynonym(phoneticSeriesIndex: string, indexedSynonym: StoredSynonym) {
    let synonyms = this._getSynonymList(phoneticSeriesIndex);
    if (synonyms === null) {
      synonyms = [];
    }
    for (const synonym of synonyms) {
      if (synonym.originalWordSeries == indexedSynonym.originalWordSeries) {
        return; // this half of the synonym is already present
      }
    }
    synonyms.push(indexedSynonym);
    this._setSynonymList(phoneticSeriesIndex, synonyms);
  }

  private _collectSynonymousSeries(
    synonymousSeries: string[],
    forPhoneticSeries: string,
    fromSynonyms: StoredSynonym[] | null
  ): void {
    if (!fromSynonyms) return;
    for (const synonym of fromSynonyms) {
      const synonymSeries = synonym.phoneticSeries;
      if (
        synonymSeries != forPhoneticSeries &&
        !synonymousSeries.includes(synonymSeries)
      ) {
        synonymousSeries.push(synonymSeries);
        this._collectSynonymousSeries(
          synonymousSeries,
          forPhoneticSeries,
          this._getSynonymList(synonymSeries)
        );
      }
    }
  }

  /**
   * Removes the provided `indexedSynonym` from the provided phonetic series index.
   */
  private _removeHalfSynonym(
    phoneticSeriesIndex: string,
    indexedSynonym: StoredSynonym
  ) {
    const synonyms = this._getSynonymList(phoneticSeriesIndex);
    if (synonyms === null) {
      return; // this half of the synonym is not present
    }
    for (let i = 0; i < synonyms.length; ++i) {
      if (synonyms[i].originalWordSeries == indexedSynonym.originalWordSeries) {
        synonyms.splice(i, 1);
        this._setSynonymList(phoneticSeriesIndex, synonyms);
        return; // removed this half of synonym
      }
    }
    // if reaches here, this half of the synonym was not present
  }
}
