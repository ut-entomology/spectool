/**
 * Structure representing a word series/phonetic series pair.
 */
export interface SeriesPair {
  wordSeries: string; // occurrence-ordered word series for the phonetic series
  phoneticSeries: string; // sorted phonetic series for the word series
}

/**
 * Base class for storage that allows for looking up synonymies by the phonetic
 * series of any synonym participating in the synonymy.
 */
export abstract class PotentialSynonymsStore{
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
   * Returns the synonymy in which the provided phonetic series participates, or
   * null if no synonyms are associated with the phonetic series. The return value
   * maps occurrence-ordered word series to their synonymously-equivalent series.
   */
  abstract getSynonymMap(phoneticSeries: string): Record<string, SeriesPair[]>;

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
   * Associates the provided synonymy with the provided phonetic series. This method
   * should NOT also provide the reverse association, as the caller will do that.
   */
  protected abstract _setSynonymMap(
     phoneticSeries: string, synonymMap: Record<string, SeriesPair[]>
  ): void;

  /**
   * Indexes the provided `lookupPair` by the provided `indexPair`.
   */
  private _addHalfSynonym(indexPair: SeriesPair, lookupPair: SeriesPair) {
    let synonymMap = this.getSynonymMap(indexPair.phoneticSeries);
    if (synonymMap === null) {
      synonymMap = {};
    }
    let indexSeriesPairs = synonymMap[indexPair.wordSeries];
    if (!indexSeriesPairs) {
      indexSeriesPairs = [];
      synonymMap[indexPair.wordSeries] = indexSeriesPairs;
    }
    for (const seriesPair of indexSeriesPairs) {
      if (seriesPair.wordSeries == lookupPair.wordSeries) {
        return; // this half of the synonym is already present
      }
    }
    indexSeriesPairs.push(lookupPair);
    this._setSynonymMap(indexPair.phoneticSeries, synonymMap);
  }

  /**
   * Removes the provided `lookupPair` from its index at the provided `indexPair`.
   */
  private _removeHalfSynonym(indexPair: SeriesPair, lookupPair: SeriesPair) {
    const synonymMap = this.getSynonymMap(indexPair.phoneticSeries);
    if (synonymMap === null) {
      return; // this half of the synonym is not present
    }
    const indexSeriesPairs = synonymMap[indexPair.wordSeries];
    if (!indexSeriesPairs) {
      return; // this half of the synonym is not present
    }
    for (let i = 0; i < indexSeriesPairs.length; ++i) {
      if (indexSeriesPairs[i].wordSeries == lookupPair.wordSeries) {
        indexSeriesPairs.splice(i, 1);
        this._setSynonymMap(indexPair.phoneticSeries, synonymMap);
        return; // removed this half of synonym
      }
    }
  }
}
