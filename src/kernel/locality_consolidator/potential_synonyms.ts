/**
 * Structure representing a word series/phonetic series pair that participates
 * in a synonymous relationship with at least one other such pair.
 */
export interface SeriesEquivalent {
  wordSeries: string; // occurrence-ordered word series for the phonetic series
  phoneticSeries: string; // sorted phonetic series for the word series
}

/**
 * Base class for storage that allows for looking up synonymies by the phonetic
 * series of any synonym participating in the synonymy.
 */
export abstract class PotentialSynonymsStore{
  /**
   * Adds a synonym to the storage, where `series1` is equivalent to `series2`.
   * Argument order does not matter.
   */
  addSynonym(series1: SeriesEquivalent, series2: SeriesEquivalent): void {
    // Make occurrences of series1 map to series2.
    this._addHalfSynonym(series1, series2);
    // Make occurrences of series2 map to series1.
    this._addHalfSynonym(series2, series1);
  }

  /**
   * Returns the synonymy in which the provided phonetic series participates, or
   * null if no synonyms are associated with the phonetic series. The return value
   * maps occurrence-ordered word series to their synonymously-equivalent series.
   */
  abstract getSynonymMap(phoneticSeries: string): Record<string, SeriesEquivalent[]>;

  /**
   * Removes a synonym from the storage, where `series1` is no longer to be treated
   * as equivalent to `series2`. Argument order does not matter.
   */
  removeSynonym(series1: SeriesEquivalent, series2: SeriesEquivalent): void {
    // Remove mapping of series1 to series2.
    this._removeHalfSynonym(series1, series2);
    // Remove mapping of series2 to series1.
    this._removeHalfSynonym(series2, series1);
  }

  /**
   * Associates the provided synonymy with the provided phonetic series. This method
   * should NOT also provide the reverse association, as the caller will do that.
   */
  protected abstract _setSynonymMap(
     phoneticSeries: string, synonymMap: Record<string, SeriesEquivalent[]>
  ): void;

  /**
   * Indexes the provided `lookupSeries` by the provided `indexSeries`.
   */
  private _addHalfSynonym(indexSeries: SeriesEquivalent, lookupSeries: SeriesEquivalent) {
    let synonymMap = this.getSynonymMap(indexSeries.phoneticSeries);
    if (synonymMap === null) {
      synonymMap = {};
    }
    let indexSeriesEquivalents = synonymMap[indexSeries.wordSeries];
    if (!indexSeriesEquivalents) {
      indexSeriesEquivalents = [];
      synonymMap[indexSeries.wordSeries] = indexSeriesEquivalents;
    }
    for (const equivalent of indexSeriesEquivalents) {
      if (equivalent.wordSeries == lookupSeries.wordSeries) {
        return; // this half of the synonym is already present
      }
    }
    indexSeriesEquivalents.push(lookupSeries);
    this._setSynonymMap(indexSeries.phoneticSeries, synonymMap);
  }

  /**
   * Removes the provided `lookupSeries` from its index at the provided `indexSeries`.
   */
  private _removeHalfSynonym(indexSeries: SeriesEquivalent, lookupSeries: SeriesEquivalent) {
    const synonymMap = this.getSynonymMap(indexSeries.phoneticSeries);
    if (synonymMap === null) {
      return; // this half of the synonym is not present
    }
    const indexSeriesEquivalents = synonymMap[indexSeries.wordSeries];
    if (!indexSeriesEquivalents) {
      return; // this half of the synonym is not present
    }
    for (let i = 0; i < indexSeriesEquivalents.length; ++i) {
      if (indexSeriesEquivalents[i].wordSeries == lookupSeries.wordSeries) {
        indexSeriesEquivalents.splice(i, 1);
        this._setSynonymMap(indexSeries.phoneticSeries, synonymMap);
        return; // removed this half of synonym
      }
    }
  }
}
