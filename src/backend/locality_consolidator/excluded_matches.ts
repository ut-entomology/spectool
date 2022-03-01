/**
 * Storage for tracking with apparent matches among localities are not to be
 * considered matches for purposes of presenting the user with possible duplicate
 * localities. It can record excluding localities with identical word series in
 * different regions, identical word series at different coordinates within the
 * same region, and specific matchings of word series.
 */

/**
 * An entry in the excluded matches store describing the exclusions for a
 * particular word series not itself found in the entry.
 */
export interface ExcludedMatchEntry {
  nonmatchingRegionIDPairings: number[][]; // list of region pairs
  nonmatchingCoordinatePairings: number[][][]; // list of coordinate pairs
  nonmatchingWords: string[];
}

/**
 * Abstract base class for storing excluded match entries. It constructs entries
 * from caller-provided information but returns the entries themselves on lookup.
 */
export abstract class ExcludedMatchesStore {
  /**
   * Record that two localities in two distinct regions matching on the same word
   * series are not to be presented as possible duplicates of the same locality.
   */
  excludeRegionMatch(wordSeries: string, regionId1: number, regionId2: number): void {
    const exclusions = this._getOrCreateExcludedMatches(wordSeries)!;
    if (
      !containsRegionIDPairing(
        exclusions.nonmatchingRegionIDPairings,
        regionId1,
        regionId2
      )
    ) {
      exclusions.nonmatchingRegionIDPairings.push([regionId1, regionId2]);
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
    const exclusions = this._getOrCreateExcludedMatches(wordSeries)!;
    if (
      !containsCoordinatePairing(
        exclusions.nonmatchingCoordinatePairings,
        coords1,
        coords2
      )
    ) {
      exclusions.nonmatchingCoordinatePairings.push([coords1, coords2]);
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
    const exclusions1 = this._getOrCreateExcludedMatches(wordSeries1)!;
    if (!exclusions1.nonmatchingWords.includes(wordSeries2)) {
      exclusions1.nonmatchingWords.push(wordSeries2);
      this._setExcludedMatches(wordSeries1, exclusions1);
    }
    // Exclusions lookup must be symmetric on excluded matches of word series.
    if (wordSeries1 != wordSeries2) {
      const exclusions2 = this._getOrCreateExcludedMatches(wordSeries2)!;
      if (!exclusions2.nonmatchingWords.includes(wordSeries1)) {
        exclusions2.nonmatchingWords.push(wordSeries1);
        this._setExcludedMatches(wordSeries2, exclusions2);
      }
    }
  }

  /**
   * Returns the excluded matches previously recorded for the indicated word series
   * or null if no excluded matches are found for the word series.
   */
  abstract getExcludedMatches(wordSeries: string): ExcludedMatchEntry | null;

  protected _getOrCreateExcludedMatches(wordSeries: string): ExcludedMatchEntry | null {
    const entry = this.getExcludedMatches(wordSeries);
    if (entry) return entry;
    return {
      nonmatchingRegionIDPairings: [],
      nonmatchingCoordinatePairings: [],
      nonmatchingWords: []
    };
  }

  protected abstract _setExcludedMatches(
    wordSeries: string,
    entry: ExcludedMatchEntry
  ): void;
}

/**
 * Returns tree iff the given pairing of coordinate pairs is found in the given
 * list of coordinate pairings, irrespective of the order in the pairings.
 */
export function containsCoordinatePairing(
  coordinatePairings: number[][][],
  coord1: (number | null)[],
  coord2: (number | null)[]
): boolean {
  if (
    coord1[0] === null ||
    coord1[1] === null ||
    coord2[0] === null ||
    coord2[1] === null
  ) {
    return false;
  }
  for (const pairing of coordinatePairings) {
    const pairedCoord1 = pairing[0];
    const pairedCoord2 = pairing[1];
    if (
      (pairedCoord1[0] == coord1[0] &&
        pairedCoord1[1] == coord1[1] &&
        pairedCoord2[0] == coord2[0] &&
        pairedCoord2[1] == coord2[1]) ||
      (pairedCoord1[0] == coord2[0] &&
        pairedCoord1[1] == coord2[1] &&
        pairedCoord2[0] == coord1[0] &&
        pairedCoord2[1] == coord1[1])
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Returns true iff the given pairing of region IDs is found in the given list
 * of region ID pairings, irrespective of the order in the pairings.
 */
export function containsRegionIDPairing(
  regionIDPairings: number[][],
  regionID1: number,
  regionID2: number
): boolean {
  for (const pairing of regionIDPairings) {
    if (
      (pairing[0] == regionID1 && pairing[1] == regionID2) ||
      (pairing[0] == regionID2 && pairing[1] == regionID1)
    ) {
      return true;
    }
  }
  return false;
}
