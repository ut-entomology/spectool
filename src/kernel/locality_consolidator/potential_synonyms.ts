/**
 * Structure representing a word series/phonetic series pair.
 */
export interface SeriesPair {
  wordSeries: string; // occurrence-ordered word series for the phonetic series
  phoneticSeries: string; // sorted phonetic series for the word series
}

/**
 * Base class for synonyms among locality word series.
 */
export abstract class PotentialSynonymsStore {
  /**
   * Adds a synonym to the storage, where `seriesPair1` is equivalent to
   * `seriesPair2`. Argument order does not matter.
   */
  addSynonym(seriesPair1: SeriesPair, seriesPair2: SeriesPair): void {
    // Make occurrences of series1 map to series2.
    this._addHalfSynonym(seriesPair1, seriesPair2);
    // Make occurrences of series2 map to series1.
    this._addHalfSynonym(seriesPair2, seriesPair1);
  }

  /**
   * Returns the synonyms in which the provided phonetic series participates, or
   * null if no synonyms are associated with the phonetic series. The returned
   * value excludes the series pair for the provided phonetic series.
   */
  abstract getSynonyms(phoneticSeries: string): SeriesPair[] | null;

  /**
   * Removes a synonym from the storage, where `seriesPair1` is no longer to be
   * treated as equivalent to `seriesPair2`. Argument order does not matter.
   */
  removeSynonym(seriesPair1: SeriesPair, seriesPair2: SeriesPair): void {
    // Remove mapping of series1 to series2.
    this._removeHalfSynonym(seriesPair1, seriesPair2);
    // Remove mapping of series2 to series1.
    this._removeHalfSynonym(seriesPair2, seriesPair1);
  }

  /**
   * Assigns the provided set of synonyms to a given phonetic series. This method
   * should NOT also provide reverse associations, as the caller does that.
   */
  protected abstract _setSynonyms(phoneticSeries: string, synonyms: SeriesPair[]): void;

  /**
   * Indexes the provided `lookupPair` by the provided `indexPair`.
   */
  private _addHalfSynonym(indexPair: SeriesPair, lookupPair: SeriesPair) {
    let synonyms = this.getSynonyms(indexPair.phoneticSeries);
    if (synonyms === null) {
      synonyms = [];
    }
    for (const synonym of synonyms) {
      if (synonym.wordSeries == lookupPair.wordSeries) {
        return; // this half of the synonym is already present
      }
    }
    synonyms.push(lookupPair);
    this._setSynonyms(indexPair.phoneticSeries, synonyms);
  }

  /**
   * Removes the provided `lookupPair` from its index at the provided `indexPair`.
   */
  private _removeHalfSynonym(indexPair: SeriesPair, lookupPair: SeriesPair) {
    const synonyms = this.getSynonyms(indexPair.phoneticSeries);
    if (synonyms === null) {
      return; // this half of the synonym is not present
    }
    for (let i = 0; i < synonyms.length; ++i) {
      if (synonyms[i].wordSeries == lookupPair.wordSeries) {
        synonyms.splice(i, 1);
        this._setSynonyms(indexPair.phoneticSeries, synonyms);
        return; // removed this half of synonym
      }
    }
    // if reaches here, this half of the synonym was not present
  }
}
