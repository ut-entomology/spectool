/**
 * Structures describing similarities found between matching localities.
 */

/**
 * Interface describing two localities that may be duplicates and their similarities.
 */
export interface LocalityMatch {
  baseLocality: LocalityData;
  testLocality: LocalityData;
  phoneticMatches: PhoneticMatch[];
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
 * Interface describing the portions of two localities that match phonetically-
 * similar series or phonetically-synonymous series.
 */
export interface PhoneticMatch {
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
  included?: boolean; // whether subset survived excluded matches
}
