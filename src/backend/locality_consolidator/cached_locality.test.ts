import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

import { Region, RegionRank } from '../../shared/shared_geography';
import type {
  //MatchedLocality,
  PhoneticSubset
  //PhoneticMatch
} from '../../shared/shared_locality';
import { TrackedRegion } from './tracked_region';
import { CachedLocality } from './cached_locality';

describe('word series utilities', () => {
  const fooBarPark = createCachedLocality('Foo Bar Park');

  test('produces the entire word series', () => {
    const wordSeries = fooBarPark.getEntireWordSeries();
    expect(wordSeries).toEqual('foo bar park');
  });

  test('produces word series for a phonetic subset', () => {
    let subset: PhoneticSubset = {
      phoneticSeries: 'FO BR PK',
      firstWordIndex: 0,
      lastWordIndex: 2
    };
    expect(fooBarPark.getWordSeries(subset)).toEqual('foo bar park');
    expect(subset.cachedWordSeries).toEqual('foo bar park');

    subset = {
      phoneticSeries: 'FO',
      firstWordIndex: 0,
      lastWordIndex: 0
    };
    expect(fooBarPark.getWordSeries(subset)).toEqual('foo');
    expect(subset.cachedWordSeries).toEqual('foo');

    subset = {
      phoneticSeries: 'BR PK',
      firstWordIndex: 1,
      lastWordIndex: 2
    };
    expect(fooBarPark.getWordSeries(subset)).toEqual('bar park');
    expect(subset.cachedWordSeries).toEqual('bar park');
  });
});

describe('finding phonetic subsets of a locality', () => {
  const fooBarPark = createCachedLocality('Foo Bar Park');

  test('no subsets found', () => {
    let subsets = fooBarPark.findPhoneticSubsets(['GA']);
    expect(subsets).toEqual([]);
  });

  test('subsets of phonetic series with no phonetic duplication', () => {
    const fooBarParkWordSeries = fooBarPark.words!.join(' ');
    for (let i = 0; i < fooBarPark.words!.length; ++i) {
      for (let j = i; j < fooBarPark.words!.length; ++j) {
        const phoneticSeries = toPartialPhoneticSeries(fooBarParkWordSeries, i, j);
        const subsets = fooBarPark.findPhoneticSubsets([phoneticSeries]);
        expect(subsets).toEqual([
          {
            phoneticSeries,
            firstWordIndex: i,
            lastWordIndex: j
          }
        ]);
      }
    }
  });

  test('subsets with single-phonetic-code but not word duplication', () => {
    const phoneticDupLocality = createCachedLocality('Ruff Roof Place');
    const wordSeries = phoneticDupLocality.words!.join(' ');

    let phoneticSeries = toPartialPhoneticSeries(wordSeries, 0, 0);
    let subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    phoneticSeries = toPartialPhoneticSeries(wordSeries, 1, 1);
    subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    phoneticSeries = toPartialPhoneticSeries(wordSeries, 1, 2);
    subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 2
      }
    ]);
  });

  test('subsets with single-word duplication', () => {
    const phoneticDupLocality = createCachedLocality('Ruff Ruff Place');
    const wordSeries = phoneticDupLocality.words!.join(' ');

    let phoneticSeries = toPartialPhoneticSeries(wordSeries, 0, 0);
    let subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    phoneticSeries = toPartialPhoneticSeries(wordSeries, 1, 1);
    subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    phoneticSeries = toPartialPhoneticSeries(wordSeries, 1, 2);
    subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 2
      }
    ]);
  });

  test('subsets with multi-word duplication', () => {
    const phoneticDupLocality = createCachedLocality('From Ruff Roof and Roof Ruff');
    const wordSeries = phoneticDupLocality.words!.join(' ');

    let phoneticSeries = toPartialPhoneticSeries(wordSeries, 0, 0);
    let subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        phoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      },
      {
        phoneticSeries,
        firstWordIndex: 2,
        lastWordIndex: 2
      },
      {
        phoneticSeries,
        firstWordIndex: 3,
        lastWordIndex: 3
      }
    ]);

    phoneticSeries = toPartialPhoneticSeries(wordSeries, 0, 1);
    subsets = phoneticDupLocality.findPhoneticSubsets([phoneticSeries]);
    expect(subsets).toEqual([
      {
        phoneticSeries, // "ruff roof"
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        phoneticSeries, // "roof roof"
        firstWordIndex: 1,
        lastWordIndex: 2
      },
      {
        phoneticSeries, // "roof ruff"
        firstWordIndex: 2,
        lastWordIndex: 3
      }
    ]);
  });
});

describe('find similarities between two localities', () => {
  test('', () => {
    //
  });
});

function createCachedLocality(wordSeries: string): CachedLocality {
  const region = new Region(1, RegionRank.County, 'Travis County', 0);
  const trackedRegion = new TrackedRegion(region, true);
  return new CachedLocality(
    trackedRegion,
    1,
    23.1,
    -97.1,
    wordSeries,
    '',
    new Date('January 1, 2022').getTime()
  );
}

function toPartialPhoneticSeries(
  wordSeries: string,
  startIndex: number,
  endIndex: number
): string {
  const words = wordSeries.split(' ');
  const partialWordSeries = words.slice(startIndex, endIndex + 1).join(' ');
  return toPhoneticSeries(partialWordSeries);
}

function toPhoneticSeries(wordSeries: string): string {
  const words = wordSeries.split(' ');
  return words
    .map((word) => (/[0-9]/.test(word) ? '#' + word : fuzzySoundex(word)))
    .sort()
    .join(' ');
}
