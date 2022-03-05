import { Region, RegionRank } from '../../shared/shared_geography';
import type { PhoneticSubset } from '../../shared/shared_locality';
import { TrackedRegion } from './tracked_region';
import { CachedLocality } from './cached_locality';
import {
  toPartialSortedPhoneticSeries,
  toSortedPhoneticSeries
} from './mock/phonetic_util';

describe('word series utilities', () => {
  const fooBarPark = createCachedLocality('Foo Bar Park');

  test('produces the entire word series', () => {
    const wordSeries = fooBarPark.getEntireWordSeries();
    expect(wordSeries).toEqual('foo bar park');
  });

  test('produces word series for a phonetic subset', () => {
    let subset: PhoneticSubset = {
      sortedPhoneticSeries: 'BR FO PK',
      firstWordIndex: 0,
      lastWordIndex: 2
    };
    expect(fooBarPark.getWordSeries(subset)).toEqual('foo bar park');
    expect(subset.cachedWordSeries).toEqual('foo bar park');

    subset = {
      sortedPhoneticSeries: 'FO',
      firstWordIndex: 0,
      lastWordIndex: 0
    };
    expect(fooBarPark.getWordSeries(subset)).toEqual('foo');
    expect(subset.cachedWordSeries).toEqual('foo');

    subset = {
      sortedPhoneticSeries: 'BR PK',
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
        const sortedPhoneticSeries = toPartialSortedPhoneticSeries(
          fooBarParkWordSeries,
          i,
          j
        );
        const subsets = fooBarPark.findPhoneticSubsets([sortedPhoneticSeries]);
        expect(subsets).toEqual([
          {
            sortedPhoneticSeries,
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

    let sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 0, 0);
    let subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 1, 1);
    subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 1, 2);
    subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 2
      }
    ]);
  });

  test('subsets with single-word duplication', () => {
    const phoneticDupLocality = createCachedLocality('Ruff Ruff Place');
    const wordSeries = phoneticDupLocality.words!.join(' ');

    let sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 0, 0);
    let subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 1, 1);
    subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      }
    ]);

    sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 1, 2);
    subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 2
      }
    ]);
  });

  test('subsets with multi-word duplication', () => {
    const phoneticDupLocality = createCachedLocality('From Ruff Roof and Roof Ruff');
    const wordSeries = phoneticDupLocality.words!.join(' ');

    let sortedPhoneticSeries = toPartialSortedPhoneticSeries(wordSeries, 0, 0);
    let subsets = phoneticDupLocality.findPhoneticSubsets([sortedPhoneticSeries]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 0,
        lastWordIndex: 3
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 1,
        lastWordIndex: 3
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 2,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 2,
        lastWordIndex: 3
      },
      {
        sortedPhoneticSeries,
        firstWordIndex: 3,
        lastWordIndex: 3
      }
    ]);
  });

  test('find multiple phonetic series, no duplicate phonetics', () => {
    const locality1 = createCachedLocality('Piney Green Forest');
    const wordSeries = locality1.words!.join(' ');
    const phoneticSeries0_1 = toPartialSortedPhoneticSeries(wordSeries, 0, 1);
    const phoneticSeries1_1 = toPartialSortedPhoneticSeries(wordSeries, 1, 1);
    const phoneticSeries1_2 = toPartialSortedPhoneticSeries(wordSeries, 1, 2);
    const subsets = locality1.findPhoneticSubsets([
      phoneticSeries1_2,
      phoneticSeries1_1,
      phoneticSeries0_1
    ]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries: phoneticSeries0_1,
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries: phoneticSeries1_1,
        firstWordIndex: 1,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries: phoneticSeries1_2,
        firstWordIndex: 1,
        lastWordIndex: 2
      }
    ]);
  });

  test('find multiple phonetic series, with duplicate phonetics', () => {
    const locality1 = createCachedLocality('Green Piney Greene Forest');
    const wordSeries = locality1.words!.join(' ');
    const phoneticSeries0_0 = toPartialSortedPhoneticSeries(wordSeries, 0, 0);
    const phoneticSeries1_2 = toPartialSortedPhoneticSeries(wordSeries, 1, 2);
    const phoneticSeries2_3 = toPartialSortedPhoneticSeries(wordSeries, 2, 3);
    const subsets = locality1.findPhoneticSubsets([
      phoneticSeries2_3,
      phoneticSeries1_2,
      phoneticSeries0_0
    ]);
    expect(subsets).toEqual([
      {
        sortedPhoneticSeries: phoneticSeries0_0,
        firstWordIndex: 0,
        lastWordIndex: 0
      },
      {
        sortedPhoneticSeries: phoneticSeries0_0,
        firstWordIndex: 2,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries: phoneticSeries1_2, // "Green Piney" ~ "Piney Greene"
        firstWordIndex: 0,
        lastWordIndex: 1
      },
      {
        sortedPhoneticSeries: phoneticSeries1_2, // "Green Piney" ~ "Green Piney Greene"
        firstWordIndex: 0,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries: phoneticSeries1_2, // "Piney Greene" ~ "Piney Greene"
        firstWordIndex: 1,
        lastWordIndex: 2
      },
      {
        sortedPhoneticSeries: phoneticSeries2_3,
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
    const sortedPhoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: sortedPhoneticSeries,
        baseSubsets: [
          {
            sortedPhoneticSeries,
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries,
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

    // 'Ruff Roof Park' / 'Woodland Park'
    let matches = locality1.findPhoneticMatches(locality2);
    let sortedPhoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: sortedPhoneticSeries,
        baseSubsets: [
          {
            sortedPhoneticSeries,
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality1.name.indexOf('Park'),
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries,
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: locality2.name.indexOf('Park'),
            lastCharIndexPlusOne: locality2.name.length
          }
        ]
      }
    ]);

    // 'Park of Canyons' / 'Ruff Roof Park'
    matches = locality3.findPhoneticMatches(locality1);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: sortedPhoneticSeries,
        baseSubsets: [
          {
            sortedPhoneticSeries,
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'Park'.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries,
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

    // 'Greeen Park' / 'Green Park'
    let matches = locality0.findPhoneticMatches(locality1);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries(locality0.name),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries(locality0.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality0.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries(locality1.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality1.name.length
          }
        ]
      }
    ]);

    // 'Green Park' / 'Green Woodz Park'
    matches = locality1.findPhoneticMatches(locality3);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('green'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('green'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'green'.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('green'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'green'.length
          }
        ]
      },
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('park'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('park'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: locality1.name.indexOf('Park'),
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('park'),
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality3.name.indexOf('Park'),
            lastCharIndexPlusOne: locality3.name.length
          }
        ]
      }
    ]);

    // 'Green Woods' / 'Green Woodz Park'
    matches = locality2.findPhoneticMatches(locality3);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries(locality2.name),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries(locality2.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality2.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries(locality2.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality2.name.length
          }
        ]
      }
    ]);

    // 'Green Woodz Park' / 'Woods Park'
    matches = locality3.findPhoneticMatches(locality4);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries(locality4.name),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries(locality4.name),
            firstWordIndex: 1,
            lastWordIndex: 2,
            firstCharIndex: locality3.name.indexOf('Woodz'),
            lastCharIndexPlusOne: locality3.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries(locality4.name),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality4.name.length
          }
        ]
      }
    ]);

    // 'Green Woodz Park' / 'Park of Green'
    matches = locality3.findPhoneticMatches(locality5);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('green'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('green'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'green'.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('green'),
            firstWordIndex: 1,
            lastWordIndex: 1,
            firstCharIndex: locality5.name.indexOf('Green'),
            lastCharIndexPlusOne: locality5.name.length
          }
        ]
      },
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('park'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('park'),
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: locality3.name.indexOf('Park'),
            lastCharIndexPlusOne: locality3.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('park'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'park'.length
          }
        ]
      }
    ]);
  });

  test('duplicate word matches', () => {
    const locality1 = createCachedLocality('Foo Foo Forest');
    const locality2 = createCachedLocality('Foo Woods');
    const locality3 = createCachedLocality('Foo Bar Foo');
    const locality4 = createCachedLocality('Foo Forest');

    // 'Foo Foo Forest' / 'Foo Woods'
    let matches = locality1.findPhoneticMatches(locality2);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo foo'.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          }
        ]
      }
    ]);

    // 'Foo Woods' / 'Foo Foo Forest'
    matches = locality2.findPhoneticMatches(locality1);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo foo'.length
          }
        ]
      }
    ]);

    // 'Foo Foo Forest' / 'Foo Bar Foo'
    matches = locality1.findPhoneticMatches(locality3);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 1,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo foo'.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 0,
            lastWordIndex: 0,
            firstCharIndex: 0,
            lastCharIndexPlusOne: 'foo'.length
          },
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo'),
            firstWordIndex: 2,
            lastWordIndex: 2,
            firstCharIndex: 'foo bar '.length,
            lastCharIndexPlusOne: locality3.name.length
          }
        ]
      }
    ]);

    // 'Foo Foo Forest' / 'Foo Forest'
    matches = locality1.findPhoneticMatches(locality4);
    expect(matches).toEqual([
      {
        sortedPhoneticSeries: toSortedPhoneticSeries('foo forest'),
        baseSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo forest'),
            firstWordIndex: 0,
            lastWordIndex: 2,
            firstCharIndex: 0,
            lastCharIndexPlusOne: locality1.name.length
          }
        ],
        testSubsets: [
          {
            sortedPhoneticSeries: toSortedPhoneticSeries('foo forest'),
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
  return new CachedLocality({
    regionID: trackedRegion.id,
    localityID: 1,
    latitude: 23.1,
    longitude: -97.1,
    name: wordSeries,
    remarks: '',
    lastModified: new Date('January 1, 2022').getTime()
  });
}
