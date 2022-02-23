export interface PhoneticSubset {
  phoneticSeries: string; // sorted spaced-delimited phonetic codes
  firstWordIndex: number;
  lastWordIndex: number;
  firstCharIndex?: number;
  lastCharIndexPlusOne?: number;
  cachedWordSeries?: string; // generated only as needed
}

export interface PhoneticMatch {
  phoneticSeries: string; // sorted spaced-delimited phonetic codes
  baseSubsets: PhoneticSubset[];
  testSubsets: PhoneticSubset[];
}
