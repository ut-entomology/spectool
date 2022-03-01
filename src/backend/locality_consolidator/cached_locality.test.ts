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

  test('find multiple phonetic series, no duplicate phonetics', () => {
    const locality1 = createCachedLocality('Piney Green Forest');
    const wordSeries = locality1.words!.join(' ');
    const phoneticSeries0_1 = toPartialPhoneticSeries(wordSeries, 0, 1);
    const phoneticSeries1_1 = toPartialPhoneticSeries(wordSeries, 1, 1);
    const phoneticSeries1_2 = toPartialPhoneticSeries(wordSeries, 1, 2);
    const subsets = locality1.findPhoneticSubsets([
      phoneticSeries1_2,
      phoneticSeries1_1,
      phoneticSeries0_1
    ]);
    expect(subsets).toEqual([
      {
        phoneticSeries: phoneticSeries0_1,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        phoneticSeries: phoneticSeries1_1,
        firstWordIndex: 1,
        lastWordIndex: 1
      },
      {
        phoneticSeries: phoneticSeries1_2,
        firstWordIndex: 1,
        lastWordIndex: 2
      }
    ]);
  });

  test('find multiple phonetic series, with duplicate phonetics', () => {
    const locality1 = createCachedLocality('Green Piney Greene Forest');
    const wordSeries = locality1.words!.join(' ');
    const phoneticSeries0_0 = toPartialPhoneticSeries(wordSeries, 0, 0);
    const phoneticSeries1_2 = toPartialPhoneticSeries(wordSeries, 1, 2);
    const phoneticSeries2_3 = toPartialPhoneticSeries(wordSeries, 2, 3);
    const subsets = locality1.findPhoneticSubsets([
      phoneticSeries2_3,
      phoneticSeries1_2,
      phoneticSeries0_0
    ]);
    expect(subsets).toEqual([
      {
        phoneticSeries: phoneticSeries0_0,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        phoneticSeries: phoneticSeries0_0,
        firstWordIndex: 2,
        lastWordIndex: 2
      },
      {
        phoneticSeries: phoneticSeries1_2, // "Green Piney" ~ "Piney Greene"
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        phoneticSeries: phoneticSeries1_2, // "Piney Greene" ~ "Piney Greene"
        firstWordIndex: 1,
        lastWordIndex: 2
      },
      {
        phoneticSeries: phoneticSeries2_3,
        firstWordIndex: 2,
        lastWordIndex: 3
      }
    ]);
  });
});

describe('find similarities between two localities', () => {
  test('no similarity between locations', () => {
    const locality1 = createCachedLocality('Ruff Park');
    const locality2 = createCachedLocality('Woodland Preserve');
    const matches = locality1.findPhoneticMatches(locality2);
    expect(matches).toEqual([]);
  });

  test('identical single-word locations', () => {
    const locality1 = createCachedLocality('Park');
    const locality2 = createCachedLocality('Park');
    const matches = locality1.findPhoneticMatches(locality2);
    const phoneticSeries = toPhoneticSeries('park');
    expect(matches).toEqual([
      {
        phoneticSeries: phoneticSeries,
        baseSubsets: [
          {
            phoneticSeries,
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries,
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality2.name.length
          }
        ]
      }
    ]);
  });

  test('single-word similarity between locations', () => {
    const locality1 = createCachedLocality('Ruff Roof Park');
    const locality2 = createCachedLocality('Woodland Park');
    const locality3 = createCachedLocality('Park of Canyons');

    let matches = locality1.findPhoneticMatches(locality2);
    let phoneticSeries = toPhoneticSeries('park');
    expect(matches).toEqual([
      {
        phoneticSeries: phoneticSeries,
        baseSubsets: [
          {
            phoneticSeries,
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality1.name.indexOf('Park'),
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries,
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: locality2.name.indexOf('Park'),
            lastCharIndexPlusOne: locality2.name.length
          }
        ]
      }
    ]);

    matches = locality3.findPhoneticMatches(locality1);
    expect(matches).toEqual([
      {
        phoneticSeries: phoneticSeries,
        baseSubsets: [
          {
            phoneticSeries,
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'Park'.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries,
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality1.name.indexOf('Park'),
            lastCharIndexPlusOne: locality1.name.length
          }
        ]
      }
    ]);
  });

  test('multi-word similarity between locations', () => {
    const locality0 = createCachedLocality('Greeen Park');
    const locality1 = createCachedLocality('Green Park');
    const locality2 = createCachedLocality('Green Woods');
    const locality3 = createCachedLocality('Green Woodz Park');
    const locality4 = createCachedLocality('Woods Park');
    const locality5 = createCachedLocality('Park of Green');

    let matches = locality0.findPhoneticMatches(locality1);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries(locality0.name),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries(locality0.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality0.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries(locality1.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality1.name.length
          }
        ]
      }
    ]);

    matches = locality1.findPhoneticMatches(locality3);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries('green'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('green'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'green'.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('green'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'green'.length
          }
        ]
      },
      {
        phoneticSeries: toPhoneticSeries('park'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('park'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: locality1.name.indexOf('Park'),
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('park'),
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality3.name.indexOf('Park'),
            lastCharIndexPlusOne: locality3.name.length
          }
        ]
      }
    ]);

    matches = locality2.findPhoneticMatches(locality3);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries(locality2.name),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries(locality2.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality2.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries(locality2.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality2.name.length
          }
        ]
      }
    ]);

    matches = locality3.findPhoneticMatches(locality4);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries(locality4.name),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries(locality4.name),
            firstWordIndex: 1,
            lastWordIndex: 2,
            firstCharIndex: locality3.name.indexOf('Woodz'),
            lastCharIndexPlusOne: locality3.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries(locality4.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality4.name.length
          }
        ]
      }
    ]);

    matches = locality3.findPhoneticMatches(locality5);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries('green'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('green'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'green'.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('green'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: locality5.name.indexOf('Green'),
            lastCharIndexPlusOne: locality5.name.length
          }
        ]
      },
      {
        phoneticSeries: toPhoneticSeries('park'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('park'),
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality3.name.indexOf('Park'),
            lastCharIndexPlusOne: locality3.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('park'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'park'.length
          }
        ]
      }
    ]);
  });

  test('duplicate base word matches', () => {
    const locality1 = createCachedLocality('Foo Foo Forest');
    const locality2 = createCachedLocality('Foo Woods');
    const locality3 = createCachedLocality('Foo Bar Foo');
    const locality4 = createCachedLocality('Foo Forest');

    let matches = locality1.findPhoneticMatches(locality2);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries('foo'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          },
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: 'foo '.length,
            lastCharIndexPlusOne: 'foo foo'.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          }
        ]
      }
    ]);

    matches = locality2.findPhoneticMatches(locality1);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries('foo'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          },
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: 'foo '.length,
            lastCharIndexPlusOne: 'foo foo'.length
          }
        ]
      }
    ]);

    matches = locality1.findPhoneticMatches(locality3);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries('foo'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          },
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: 'foo '.length,
            lastCharIndexPlusOne: 'foo foo'.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          },
          {
            phoneticSeries: toPhoneticSeries('foo'),
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: 'foo bar '.length,
            lastCharIndexPlusOne: locality3.name.length
          }
        ]
      }
    ]);

    matches = locality1.findPhoneticMatches(locality4);
    expect(matches).toEqual([
      {
        phoneticSeries: toPhoneticSeries('foo forest'),
        baseSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo forest'),
            firstWordIndex: 1,
            lastWordIndex: 2,
            firstCharIndex: 'foo '.length,
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            phoneticSeries: toPhoneticSeries('foo forest'),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality4.name.length
          }
        ]
      }
    ]);
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
