import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

export function toPartialSortedPhoneticSeries(
  wordSeries: string,
  startIndex: number,
  endIndex: number
): string {
  const words = wordSeries.split(' ');
  const partialWordSeries = words.slice(startIndex, endIndex + 1).join(' ');
  return toSortedPhoneticSeries(partialWordSeries);
}

export function toSortedPhoneticSeries(wordSeries: string): string {
  const words = wordSeries.split(' ');
  let previousCode: string | null = null;
  return words
    .map((word) => (/[0-9]/.test(word) ? '#' + word : fuzzySoundex(word)))
    .sort()
    .filter((code) => {
      const keep = code != previousCode;
      previousCode = code;
      return keep;
    })
    .join(' ');
}
