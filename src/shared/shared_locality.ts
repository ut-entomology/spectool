/**
 * Structures describing similarities found between matching localities.
 */

/**
 * Interface describing two localities that may be duplicates and their similarities.
 */
export interface LocalityMatch {
  baseLocality: LocalityData;
  testLocality: LocalityData;
  matches: PhoneticMatch[];
  excludedSubsetPairs: PhoneticSubset[][];
}

/**
 * Interface describing a locality.
 */
export interface LocalityData {
  regionID: number;
  localityID: number;
  latitude: number | null;
  longitude: number | null;
  name: string;
  remarks: string;
  lastModified: number; // UNIX time
}

/**
 * Interface describing the portions of two localities that match a particular
 * phonetic series. When representing matches of synonyms, `sortedPhoneticSeries`
 * is that of the base locality subset.
 */
export interface PhoneticMatch {
  sortedPhoneticSeries: string; // sorted and spaced-delimited codes, no dups
  baseSubsets: PhoneticSubset[];
  testSubsets: PhoneticSubset[];
}

/**
 * Interface describing a phonetically-matched portion of a locality.
 */
export interface PhoneticSubset {
  sortedPhoneticSeries: string; // sorted and spaced-delimited codes, no dups
  firstWordIndex: number;
  lastWordIndex: number;
  firstCharIndex?: number;
  lastCharIndexPlusOne?: number;
  cachedWordSeries?: string; // generated only as needed
}
