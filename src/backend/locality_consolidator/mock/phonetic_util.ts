import { CachedLocality } from '../cached_locality';

export function toPartialSortedPhoneticSeries(
  wordSeries: string,
  startIndex: number,
  endIndex: number
): string {
  const words = wordSeries.split(' ');
  const partialWordSeries = words.slice(startIndex, endIndex + 1).join(' ');
  return CachedLocality.toSortedPhoneticSeries(partialWordSeries);
}
