import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

import { Geography } from '../specify/geography';
import type {
  LocalityData,
  PhoneticSubset,
  PhoneticMatch
} from '../../shared/shared_locality';

// Words ignored when comparing localities, in addition to all words of one or two
// characteres. Adding words to this list will break stored excluded matches.
const EXCLUDED_WORDS = ['and', 'for', 'from', 'the', 'with'];

/**
 * Class representing cached information about a locality and providing
 * operations that assist with comparing localities for similarity.
 */
export class CachedLocality {
  regionID: number;
  localityID: number;
  latitude: number | null;
  longitude: number | null;
  name: string;
  words: string[] | null; // occurrence-ordered, excluding EXCLUDED_WORDS
  phoneticCodes: string[] | null; // occurrence-ordered, excluding EXCLUDED_WORDS
  remarks: string;
  lastModified: number; // UNIX time

  // Source from an object to allow the data included in the locality to evolve
  // without breaking existing code unnecessarily, particularly test code.

  constructor(data: LocalityData) {
    this.regionID = data.regionID;
    this.localityID = data.localityID;
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.name = data.name;
    this.remarks = data.remarks;
    this.lastModified = data.lastModified;

    this.words = this._toWordSeries(data.name);
    this.phoneticCodes = this._toPhoneticCodes(this.words);
  }

  // Returns a list of all subsets that match by sorted phonetic series,
  // including all of the subsets of the present locality having that
  // phonetic series and all of the subsets of the test locality also
  // having that phonetic series.

  findPhoneticMatches(testLocality: CachedLocality): PhoneticMatch[] {
    if (this.phoneticCodes == null || testLocality.phoneticCodes == null) return [];

    // Find all phonetic codes the two localities have in common.

    const commonCodesMap: Record<string, boolean> = {};
    this.phoneticCodes.forEach((code) => (commonCodesMap[code] = false));
    for (const code of testLocality.phoneticCodes) {
      if (commonCodesMap[code] !== undefined) {
        commonCodesMap[code] = true;
      }
    }

    // Find the phonetic series that are common to both localities.

    const baseSubsetsBySeries = this._getPhoneticSubsetsMap(commonCodesMap, this);
    const testSubsetsBySeries = this._getPhoneticSubsetsMap(
      commonCodesMap,
      testLocality
    );
    const commonSortedPhoneticSeries: string[] = [];
    for (const sortedPhoneticSeries of Object.keys(baseSubsetsBySeries)) {
      const testSubsets = testSubsetsBySeries[sortedPhoneticSeries];
      if (testSubsets !== undefined) {
        // phoneticSeries now known to be common to both base and test localities
        commonSortedPhoneticSeries.push(sortedPhoneticSeries);
      }
    }

    // Collect the phonetic subsets for the common phonetic series.

    const commonBaseSubsets: PhoneticSubset[] = [];
    const commonTestSubsets: PhoneticSubset[] = [];
    for (const sortedPhoneticSeries of commonSortedPhoneticSeries) {
      commonBaseSubsets.push(...baseSubsetsBySeries[sortedPhoneticSeries]);
      commonTestSubsets.push(...testSubsetsBySeries[sortedPhoneticSeries]);
    }

    // Determine the longest-spanning of these subsets for each locality,
    // indexed by phonetic series. This will eliminate subsets that are part
    // of longer subsets, but because the longer subsets were known to exist
    // in both localities, there will still be subsets in common.

    const baseCapturesBySortedSeries = this._getSubsetCapturesBySortedSeries(
      this,
      commonBaseSubsets
    );
    const testCapturesBySortedSeries = this._getSubsetCapturesBySortedSeries(
      testLocality,
      commonTestSubsets
    );

    // Assemble and return the corresponding phonetic series matches. Phonetic
    // subsets of each locality that are identical to those of the other
    // locality but subsumed by other subsets in the other locality are collected
    // as "extras" for inclusion as the last entry in `matches` (commented out).

    const matches: PhoneticMatch[] = [];
    // const extraBaseSubsets: PhoneticSubset[] = [];
    // const extraTestSubsets: PhoneticSubset[] = [];
    for (const sortedPhoneticSeries of Object.keys(baseCapturesBySortedSeries)) {
      const testCaptures = testCapturesBySortedSeries[sortedPhoneticSeries];
      if (testCaptures === undefined) {
        // extraBaseSubsets.push(...baseCapturesBySeries[phoneticSeries]);
      } else {
        // phoneticSeries now known to be common to both sets of captures
        matches.push({
          sortedPhoneticSeries,
          baseSubsets: baseCapturesBySortedSeries[sortedPhoneticSeries],
          testSubsets: testCaptures
        });
      }
    }
    // for (const phoneticSeries of Object.keys(testCapturesBySeries)) {
    //   const baseCaptures = baseCapturesBySeries[phoneticSeries];
    //   if (baseCaptures === undefined) {
    //     extraTestSubsets.push(...testCapturesBySeries[phoneticSeries]);
    //   }
    // }
    return matches;
  }

  /**
   * Returns phonetic subsets for all phonetic series simultaneously found in
   * the locality and in the provided list of sorted phonetic series.
   */
  findPhoneticSubsets(searchPhoneticSeries: string[]): PhoneticSubset[] {
    // Collect the phonetic codes found among searchPhoneticSeries.

    const searchCodes: Record<string, boolean> = {};
    for (const phoneticSeries of searchPhoneticSeries) {
      for (const code of phoneticSeries.split(' ')) {
        searchCodes[code] = true;
      }
    }

    // Collect the subsets of the locality that use only these search codes.
    // Indexed by sorted phonetic series.

    const phoneticSubsetMap = this._getPhoneticSubsetsMap(searchCodes, this);

    // Filter for just the subsets of the locality found in searchPhoneticSeries.

    const commonSubsets: PhoneticSubset[] = [];
    for (const foundSortedPhoneticSeries of Object.keys(phoneticSubsetMap)) {
      if (searchPhoneticSeries.includes(foundSortedPhoneticSeries)) {
        for (const subset of phoneticSubsetMap[foundSortedPhoneticSeries]) {
          commonSubsets.push(subset);
        }
      }
    }
    return commonSubsets;
  }

  /**
   * Returns the word series for the entire locality name. Assumes that
   * the locality has a name.
   */
  getEntireWordSeries(): string {
    return this.words!.join(' ');
  }

  /**
   * Return the occurrence-ordered word series associated with the provided
   * phonetic subset, caching them within the subset to reduce costs of later
   * calls to this method on the same subset.
   */
  getWordSeries(phoneticSubset: PhoneticSubset): string {
    if (!phoneticSubset.cachedWordSeries) {
      phoneticSubset.cachedWordSeries = this.words!.slice(
        phoneticSubset.firstWordIndex,
        phoneticSubset.lastWordIndex + 1
      ).join(' ');
    }
    return phoneticSubset.cachedWordSeries;
  }

  /**
   * Returns information about the cached locality for transfer to the client.
   */
  toData(): LocalityData {
    return {
      regionID: this.regionID,
      localityID: this.localityID,
      latitude: this.latitude,
      longitude: this.longitude,
      name: this.name,
      remarks: this.remarks,
      lastModified: this.lastModified
    };
  }

  /**
   * Returns all possible subsets of consecutive phonetic codes of a given
   * locality restricted to the codes in the provided code map, indexed by
   * a sort of the phonetic series. Because a single phonetic series may
   * occur multiple times, each index returns a list of phonetic subsets.
   */

  private _getPhoneticSubsetsMap(
    codesMap: Record<string, boolean>,
    locality: CachedLocality
  ): Record<string, PhoneticSubset[]> {
    const subsetsMap: Record<string, PhoneticSubset[]> = {};
    const phoneticCodes = locality.phoneticCodes!;
    for (let i = 0; i < phoneticCodes.length; ++i) {
      let j = i;
      while (j < phoneticCodes.length && codesMap[phoneticCodes[j]]) {
        let previousCode: string | null = null;
        const sortedPhoneticSeries = phoneticCodes
          .slice(i, j + 1)
          .sort()
          .filter((code) => {
            const keep = code != previousCode;
            previousCode = code;
            return keep;
          })
          .join(' ');
        let subsets = subsetsMap[sortedPhoneticSeries];
        if (subsets === undefined) {
          subsets = [];
          subsetsMap[sortedPhoneticSeries] = subsets;
        }
        subsets.push({
          sortedPhoneticSeries,
          firstWordIndex: i,
          lastWordIndex: j
        });
        ++j;
      }
    }
    return subsetsMap;
  }

  /**
   * Modifies the provided phonetic subsets to indicate their starting and
   * ending character locations within the original locality name. Assumes
   * that subsets are listed in their order of occurrence in the locality.
   */
  private _markWordLocations(
    locality: CachedLocality,
    subsets: PhoneticSubset[]
  ): void {
    let subsetIndex = 0;
    let wordIndex = 0;
    // Must be consistent with code in _toWordSeries. Does not leverage common
    // code because I can't remove single quotes in advance here.
    const text = Geography.latinize(locality.name).toLowerCase();
    const wordRegex = /[a-z0-9'`]{3,}/g;
    let nextMatch = wordRegex.exec(text);
    while (subsetIndex < subsets.length && nextMatch) {
      const subset = subsets[subsetIndex];
      const word = nextMatch[0].replace(/['`]/g, '');
      if (word.length >= 3 && !EXCLUDED_WORDS.includes(word)) {
        if (wordIndex == subset.firstWordIndex) {
          subset.firstCharIndex = nextMatch.index;
        }
        if (wordIndex == subset.lastWordIndex) {
          subset.lastCharIndexPlusOne = nextMatch.index + nextMatch[0].length;
          ++subsetIndex;
        }
        ++wordIndex;
      }
      nextMatch = wordRegex.exec(text);
    }
  }

  /**
   * Given all found phonetic subsets of a locality, determines the minimal set
   * of subsets that includes all subsets, which is the set of subsets providing
   * maximal coverage over the set of words. Any subsets that are fully contained
   * in other subsets are dropped. Returns subsets indexed by phonetic series and
   * marked for the locations of their associated words.
   */
  private _getSubsetCapturesBySortedSeries(
    locality: CachedLocality,
    subsets: PhoneticSubset[]
  ): Record<string, PhoneticSubset[]> {
    const words = locality.words!;
    const capturesByStartIndex: PhoneticSubset[] = Array(words.length);
    // Process longest subsets first so previously-captured subsets are
    // known to encompass subsequently encountered ones.
    subsets.sort((s1, s2) => {
      const s1WordLength = s1.lastWordIndex - s1.firstWordIndex;
      const s2WordLength = s2.lastWordIndex - s2.firstWordIndex;
      return s2WordLength - s1WordLength;
    });
    for (const subset of subsets) {
      let i = 0;
      // Skip past previously-captured, longer subsets.
      while (i < subset.firstWordIndex) {
        // If a minimal subset already starts here, skip past it.
        if (capturesByStartIndex[i]) {
          i = capturesByStartIndex[i].lastWordIndex + 1;
        } else {
          ++i;
        }
      }
      // If we didn't skip past the current subset, make sure it doesn't
      // overlap with any previously-captured (longer) subset.
      if (i == subset.firstWordIndex) {
        while (i < subset.lastWordIndex) {
          // If a captured subset already starts here, fail the capture.
          if (capturesByStartIndex[i]) {
            i = words.length; // end loop indicating no capture
          } else {
            ++i;
          }
        }
        // If the current subset doesn't overlap with any previously-captured
        // (longer) subsets, add it to the ordered list of captured subsets.
        if (i == subset.lastWordIndex && !capturesByStartIndex[i]) {
          capturesByStartIndex[subset.firstWordIndex] = subset;
        }
      }
    }

    // Collect all the subsets in their order of occurrence.
    const orderedCaptures = capturesByStartIndex.filter((capture) => !!capture);
    // Mark the starting and ending characters of these subsets.
    this._markWordLocations(locality, orderedCaptures);

    // Return a map of all subsets indexed by phonetic series.
    const capturesBySortedSeries: Record<string, PhoneticSubset[]> = {};
    for (const capture of orderedCaptures) {
      let capturedSubsets = capturesBySortedSeries[capture.sortedPhoneticSeries];
      if (capturedSubsets === undefined) {
        capturedSubsets = [];
        capturesBySortedSeries[capture.sortedPhoneticSeries] = capturedSubsets;
      }
      capturedSubsets.push(capture);
    }
    return capturesBySortedSeries;
  }

  /**
   * Returns a series of phonetic codes for the provided word series, ordered in
   * correspondence with their associated words. Any word containing a number
   * returns with a code equal to that word but prefixed with '#'.
   */
  private _toPhoneticCodes(words: string[] | null): string[] | null {
    if (words == null) return null;
    return words.map((word) => (/[0-9]/.test(word) ? '#' + word : fuzzySoundex(word)));
  }

  /**
   * Returns a word series for the words of a string. The series contains all words
   * of the string at least 3 characters long, excluding a few common words, with
   * accents, diacritics, and single quotes removed, all in lowercase. A word is an
   * uninterrupted sequence of alphanumeric characters. The words are sorted in the
   * order in which they appear in the provided string. Returns null if the string
   * contains no words (by this definition).
   */
  private _toWordSeries(text: string): string[] | null {
    // Must be consistent with code in _markWordLocations. Does not leverage common
    // code because I can't remove single quotes in advance from _markWordLocations.
    const unfilteredWords = Geography.latinize(text)
      .replace(/['`]/g, '')
      .toLowerCase()
      .match(/[a-z0-9]{3,}/g);
    if (unfilteredWords == null) return null;
    const words: string[] = [];
    for (const word of unfilteredWords) {
      if (!EXCLUDED_WORDS.includes(word)) {
        words.push(word);
      }
    }
    return words.length > 0 ? words : null;
  }
}
