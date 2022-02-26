/**
 * Structures describing similarities found between matching localities.
 */

/**
 * Interface describing two localities that may be duplicates and their similarities.
 */
export interface LocalityMatch {
  baseLocality: MatchedLocality;
  testLocality: MatchedLocality;
  matches: PhoneticMatch[];
  excludedSubsetPairs: PhoneticSubset[][];
}

/**
 * Interface describing a locality that may be a duplicate of another locality.
 */
export interface MatchedLocality {
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
 * phonetic series. When representing matches of synonyms, `phoneticSeries`
 * is that of the base locality subset.
 */
export interface PhoneticMatch {
  phoneticSeries: string; // sorted spaced-delimited phonetic codes
  baseSubsets: PhoneticSubset[];
  testSubsets: PhoneticSubset[];
}

/**
 * Interface describing a phonetically-matched portion of a locality.
 */
export interface PhoneticSubset {
  phoneticSeries: string; // sorted spaced-delimited phonetic codes
  firstWordIndex: number;
  lastWordIndex: number;
  firstCharIndex?: number;
  lastCharIndexPlusOne?: number;
  cachedWordSeries?: string; // generated only as needed
}
