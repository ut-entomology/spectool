export interface ExcludedMatchEntry {
  nonmatchingRegionIDs: number[];
  nonmatchingCoordinates: number[][];
  nonmatchingWords: string[];
}

export abstract class ExcludedMatchesStore {
  /**
   * Record that two localities in two distinct regions matching on the same word
   * series are not to be presented as possible duplicates of the same locality.
   */
  excludeRegionMatch(wordSeries: string, regionId1: number, regionId2: number): void {
    const exclusions = this.getExcludedMatches(wordSeries, true)!;
    let changed = false;
    if (!exclusions.nonmatchingRegionIDs.includes(regionId1)) {
      exclusions.nonmatchingRegionIDs.push(regionId1);
      changed = true;
    }
    if (!exclusions.nonmatchingRegionIDs.includes(regionId2)) {
      exclusions.nonmatchingRegionIDs.push(regionId2);
      changed = true;
    }
    if (changed) {
      this._setExcludedMatches(wordSeries, exclusions);
    }
  }

  /**
   * Record that two localities agreeing on coordinates (within the accuracy
   * provided) and matching on the same word series are not to be presented as
   * possible duplicates of the same locality.
   */
  excludeCoordinateMatch(
    wordSeries: string,
    coords1: number[], // nulls not allowed
    coords2: number[] // nulls not allowed
  ): void {
    const exclusions = this.getExcludedMatches(wordSeries, true)!;
    let changed = false;
    if (!containsCoords(exclusions.nonmatchingCoordinates, coords1)) {
      exclusions.nonmatchingCoordinates.push(coords1);
      changed = true;
    }
    if (!containsCoords(exclusions.nonmatchingCoordinates, coords2)) {
      exclusions.nonmatchingCoordinates.push(coords2);
      changed = true;
    }
    if (changed) {
      this._setExcludedMatches(wordSeries, exclusions);
    }
  }

  /**
   * Record that two localities matching on the indicated word series are not
   * to be presented as possible duplicates of the same locality. The word
   * series can but need not be identical, as matches may occur for phonetic
   * equivalence (irrespective of word order) or for phonetic synonymy.
   */
  excludeWordSeriesMatch(wordSeries1: string, wordSeries2: string): void {
    const exclusions1 = this.getExcludedMatches(wordSeries1, true)!;
    if (!exclusions1.nonmatchingWords.includes(wordSeries2)) {
      exclusions1.nonmatchingWords.push(wordSeries2);
      this._setExcludedMatches(wordSeries1, exclusions1);
    }
    // Exclusions lookup must be symmetric on excluded matches of word series.
    if (wordSeries1 != wordSeries2) {
      const exclusions2 = this.getExcludedMatches(wordSeries2, true)!;
      if (!exclusions2.nonmatchingWords.includes(wordSeries1)) {
        exclusions2.nonmatchingWords.push(wordSeries1);
        this._setExcludedMatches(wordSeries2, exclusions2);
      }
    }
  }

  /**
   * Returns the excluded matches previously recorded for the indicated word
   * series. `returnNewIfNotFound` indicates whether to return null or an empty
   * `ExcludedMatchEntry` if no excluded match is found for the word series.
   */
  abstract getExcludedMatches(
    wordSeries: string,
    returnNewIfNotFound?: boolean
  ): ExcludedMatchEntry | null;

  protected abstract _setExcludedMatches(
    wordSeries: string,
    entry: ExcludedMatchEntry
  ): void;
}

export function containsCoords(coordsList: number[][], coords: (number | null)[]) {
  for (const c of coordsList) {
    if (c[0] == coords[0] && c[1] == coords[1]) {
      return true;
    }
  }
  return false;
}
