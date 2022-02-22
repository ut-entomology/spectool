import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

import { Geography } from '../specify/geography';
import { TrackedRegion } from './tracked_region';
import { PhoneticSubset, PhoneticMatch } from './phonetic_match';

const EXCLUDED_WORDS = ['and', 'for', 'from', 'the', 'with'];

export class CachedLocality {
  regionID: number;
  localityID: number;
  latitude: number;
  longitude: number;
  name: string;
  words: string[] | null; // occurrence-ordered
  phonetics: string[] | null; // occurrence-ordered
  remarks: string;
  lastModified: number; // UNIX time

  constructor(
    region: TrackedRegion,
    localityID: number,
    latitude: number,
    longitude: number,
    name: string,
    remarks: string,
    lastModified: number
  ) {
    this.regionID = region.id;
    this.localityID = localityID;
    this.latitude = latitude;
    this.longitude = longitude;
    this.name = name;
    this.remarks = remarks;
    this.lastModified = lastModified;

    this.words = this._toWordSeries(name);
    this.phonetics = this._toPhoneticSeries(this.words);
  }

  findPhoneticMatches(testLocality: CachedLocality): PhoneticMatch[] {
    if (this.phonetics == null || testLocality.phonetics == null) return [];

    // Find all phonetic codes the two localities have in common.

    const commonCodesMap: Record<string, boolean> = {};
    this.phonetics.forEach((code) => (commonCodesMap[code] = false));
    for (const code of testLocality.phonetics) {
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
    const commonPhoneticSeries: string[] = [];
    for (const phoneticSeries of Object.keys(baseSubsetsBySeries)) {
      const testSubsets = testSubsetsBySeries[phoneticSeries];
      if (testSubsets !== undefined) {
        // phoneticSeries now known to be common to both base and test localities
        commonPhoneticSeries.push(phoneticSeries);
      }
    }

    // Collect the phonetic subsets for the common phonetic series.

    const commonBaseSubsets: PhoneticSubset[] = [];
    const commonTestSubsets: PhoneticSubset[] = [];
    for (const phoneticSeries of commonPhoneticSeries) {
      commonBaseSubsets.push(...baseSubsetsBySeries[phoneticSeries]);
      commonTestSubsets.push(...testSubsetsBySeries[phoneticSeries]);
    }

    // Determine the longest-spanning of these subsets for each locality,
    // indexed by phonetic series. This will eliminate subsets that are part
    // of longer subsets, but because the longer subsets were known to exist
    // in both localities, there will still be subsets in common.

    const baseCapturesBySeries = this._getSubsetCapturesBySeries(
      this,
      commonBaseSubsets
    );
    const testCapturesBySeries = this._getSubsetCapturesBySeries(
      testLocality,
      commonTestSubsets
    );

    // Assemble and return the corresponding phonetic series matches.

    const matches: PhoneticMatch[] = [];
    for (const phoneticSeries of Object.keys(baseCapturesBySeries)) {
      const testCaptures = testCapturesBySeries[phoneticSeries];
      if (testCaptures !== undefined) {
        // phoneticSeries now known to be common to both sets of captures
        matches.push({
          phoneticSeries,
          baseSubsets: baseCapturesBySeries[phoneticSeries],
          testSubsets: testCaptures
        });
      }
    }
    return matches;
  }

  /**
   * Indicates whether the locality name includes a sequence of phonetic codes
   * equal to the sequence of codes in the provided phonetic series, irrespective
   * of the order in which the phonetic codes occur.
   */
  hasPhoneticSeries(phoneticSeries: string[]): boolean {
    // It's an option to improve performance here by first making sure that all
    // the required phonetic codes are present, but this comes at the cost of
    // caching a sort of phonetics, increasing memory use. Holding off for now.

    if (!this.phonetics) return false;

    const foundCodes: Record<string, boolean> = {};
    let foundCodeCount = 0;
    const resetFoundCodes = () => {
      foundCodeCount = 0;
      phoneticSeries.forEach((code) => (foundCodes[code] = false));
    };

    resetFoundCodes();
    for (let i = 0; i < this.phonetics.length; ++i) {
      for (let j = i; j < this.phonetics.length; ++j) {
        const code = this.phonetics[j];
        if (!phoneticSeries.includes(code)) {
          break; // move on to locality's next phonetic encoding
        }
        // Ignore duplicate phonetic codes, heed newly encountered ones
        if (!foundCodes[code]) {
          if (++foundCodeCount == phoneticSeries.length) {
            return true; // all codes found in sequence
          }
          foundCodes[code] = true;
        }
      }
      // Condition not necessary but reduces wasteful processing time
      if (foundCodeCount > 0) {
        resetFoundCodes();
      }
    }
    return false;
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
    const phonetics = locality.phonetics!;
    for (let i = 0; i < phonetics.length; ++i) {
      let j = i;
      while (j < phonetics.length && codesMap[phonetics[j]]) {
        const phoneticSeries = phonetics
          .slice(i, j + 1)
          .sort()
          .join(' ');
        let subsets = subsetsMap[phoneticSeries];
        if (subsets === undefined) {
          subsets = [];
          subsetsMap[phoneticSeries] = subsets;
        }
        subsets.push({
          phoneticSeries,
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
   * maximal coverage over the set of words. Any subsets that fully contain
   * other subsets are dropped. Returns subsets indexed by phonetic series and
   * marked for the locations of their associated words.
   */
  private _getSubsetCapturesBySeries(
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
      return s1WordLength - s2WordLength;
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
    const capturesBySeries: Record<string, PhoneticSubset[]> = {};
    for (const capture of orderedCaptures) {
      let capturedSubsets = capturesBySeries[capture.phoneticSeries];
      if (!capturedSubsets === undefined) {
        capturedSubsets = [];
        capturesBySeries[capture.phoneticSeries] = capturedSubsets;
      }
      capturedSubsets.push(capture);
    }
    return capturesBySeries;
  }

  /**
   * Returns a series of phonetic codes for the provided word series, ordered in
   * correspondence with their associated words. Any word containing a number
   * returns with a code equal to that word but prefixed with '#'.
   */
  private _toPhoneticSeries(words: string[] | null): string[] | null {
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
