import { CachedLocality } from './cached_locality';
import type { LocalityCache } from './locality_cache';
import type { TrackedRegion } from './tracked_region';
import { RegionProcessor } from './region_processor';
import type { StoredSynonym } from './potential_synonyms';
import { Region, RegionRank } from '../../shared/shared_geography';
import { MockRegionAccess, RegionNode } from './mock/mock_region_access';
import { MockTrackedRegionRoster } from './mock/mock_tracked_region_roster';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';
import { MockPotentialSynonymsStore } from './mock/mock_potential_synonyms';
import { MockExcludedMatchesStore } from './mock/mock_excluded_matches';
import { PROCESS_SUBREGIONS_FLAG } from '../util/region_adjacencies';
import type { LocalityMatch, LocalityData } from '../../shared/shared_locality';
import { toPartialSortedPhoneticSeries } from './mock/phonetic_util';
import type { ExcludedMatchesStore } from './excluded_matches';

type AdjacencyMap = Record<number, Region[]>;

const toSortedPhoneticSeries = CachedLocality.toSortedPhoneticSeries;

const zilkerPhoneticSeries = toSortedPhoneticSeries('zilker');
const zilkerMatch = {
  baseSubsets: [
    {
      sortedPhoneticSeries: zilkerPhoneticSeries,
      firstWordIndex: 0,
      lastWordIndex: 0,
      firstCharIndex: 0,
      lastCharIndexPlusOne: 'Zilker'.length
    }
  ],
  testSubsets: [
    {
      sortedPhoneticSeries: zilkerPhoneticSeries,
      firstWordIndex: 0,
      lastWordIndex: 0,
      firstCharIndex: 0,
      lastCharIndexPlusOne: 'Zilker'.length
    }
  ]
};

describe('no matches', () => {
  test('process isolated region, isolated locality', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Preserve'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities
    });

    expect(matches).toEqual([]);
  });

  test('process three non-matching localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Austin Nature and Science Center'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'McKinney Roughs Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities
    });

    expect(matches).toEqual([]);
  });

  test('no match across non-adjoining regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region0, region1, region2],
      nondomainRegions: [],
      regionTree: {
        region: region0,
        children: [{ region: region1 }, { region: region2 }]
      },
      localities
    });

    expect(matches).toEqual([]);
  });

  test('comparisons with localities lacking names', async () => {
    const localities = [
      createLocalityData({
        // ensure that non-empty base subset compares with empty test subset
        remarks: 'index 0',
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      // ensure that empty base subset compares with empty test subset
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: ''
      }),
      // ensure that empty base subset compares with empty test subset
      createLocalityData({
        remarks: 'index 2',
        regionID: region1.id,
        name: ''
      }),
      // ensure that empty base subset compares with non-empty test subset
      createLocalityData({
        remarks: 'index 3',
        regionID: region1.id,
        name: 'Some Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities
    });

    expect(matches).toEqual([]);
  });
});

describe('phonetically-similar locality matching', () => {
  test('process only two single-word matching localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process three single-word matching localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Science Center at Zilker'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: 'Science Center at '.length,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: 'Science Center at '.length,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process multiple matches within localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Nature Park and Nature Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Park at Zilker Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Another Nature Preserve'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities
    });

    const zilkerSeries = toSortedPhoneticSeries('zilker');
    const parkSeries = toSortedPhoneticSeries('park');
    const naturePreserveSeries = toSortedPhoneticSeries('nature preserve');
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: zilkerSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: zilkerSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Zilker'),
                lastCharIndexPlusOne: localities[1].name.indexOf(' Park')
              }
            ]
          },
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: parkSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.indexOf(' and')
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: parkSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Park'.length
              },
              {
                sortedPhoneticSeries: parkSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[1].name.indexOf(' Park') + 1,
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: naturePreserveSeries,
                firstWordIndex: 3,
                lastWordIndex: 4,
                firstCharIndex: localities[0].name.indexOf('Nature Preserve'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: naturePreserveSeries,
                firstWordIndex: 1,
                lastWordIndex: 2,
                firstCharIndex: localities[2].name.indexOf('Nature Preserve'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('matches across adjacent regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Another Zilker'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Child Zilker'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];
    adjacencyMap[region2.id] = [region3];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region0, region1, region2, region3, region4],
      nondomainRegions: [],
      regionTree: {
        region: region0,
        children: [
          { region: region1, children: [{ region: region4 }] },
          { region: region2 },
          { region: region3 }
        ]
      },
      localities,
      adjacencyMap
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Zilker'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
      // No matches between localities[4] and region2 because the adjacency of a parent
      // region does not always imply the adjacency of a child region.
      // No matches with localities[3] in region3 because only immediately adjacent
      // regions are compared; adjacency is not transitive.
    ]);
  });

  test('matches with contained regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Park'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Another Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region0,
      domainRegions: [region0, region1, region2, region3],
      nondomainRegions: [],
      regionTree: {
        region: region0,
        children: [
          {
            region: region1,
            children: [{ region: region2 }, { region: region3 }]
          }
        ]
      },
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
      // does not match localities 1 with 2 because neither is in the processed region
    ]);
  });

  test('matches with containing regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Another Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region2,
      domainRegions: [region0, region1, region2],
      nondomainRegions: [],
      regionTree: {
        region: region0,
        children: [
          {
            region: region1,
            children: [{ region: region2 }]
          }
        ]
      },
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[2],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[3],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[3],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
      // does not match localities 0 with 1 because neither is in the processed region
    ]);
  });

  test('matches combo of contained, containing, and adjacent regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Park'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Another Park'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region3];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region0, region1, region2, region3],
      nondomainRegions: [],
      regionTree: {
        region: region0,
        children: [
          {
            region: region1,
            children: [{ region: region2 }]
          },
          { region: region3 }
        ]
      },
      localities,
      adjacencyMap
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('matches adjoining non-domain regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [region0, region2],
      regionTree: {
        region: region0,
        children: [{ region: region1 }, { region: region2 }]
      },
      localities,
      adjacencyMap
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      }
    ]);
  });
});

describe('processing non-domain regions with no baseline date', () => {
  test('matches only adjoining in-domain regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Austin City Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Park'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Another Park'
      }),
      createLocalityData({
        regionID: region5.id,
        name: 'Non-Domain Park'
      }),
      createLocalityData({
        regionID: region0.id,
        name: 'Another Non-Domain Park'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region2.id] = [region4, region5];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region2,
      domainRegions: [region1, region3, region4],
      nondomainRegions: [region0, region2, region5],
      regionTree: {
        region: region0,
        children: [
          {
            region: region1,
            children: [{ region: region2, children: [{ region: region3 }] }]
          },
          { region: region4 },
          { region: region5 }
        ]
      },
      localities,
      adjacencyMap
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('does not match localities of a processed non-domain region', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker Park'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region2],
      nondomainRegions: [region0, region1],
      regionTree: {
        region: region0,
        children: [{ region: region1 }, { region: region2 }]
      },
      localities,
      adjacencyMap
    });

    const wordSeries = 'Zilker Park';
    const phoneticSeries = toSortedPhoneticSeries(wordSeries);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: wordSeries.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });
});

describe('processing included subregions', () => {
  test('process domain region that includes its subregions', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData({
        regionID: superregion6.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Parck'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Another Parrk'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Adjacent Paark'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[superregion6.id] = [region4];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: superregion6,
      domainRegions: [superregion6, region2, region3],
      nondomainRegions: [region0, region4],
      regionTree: {
        region: region0,
        children: [
          {
            region: superregion6,
            children: [{ region: region2, children: [{ region: region3 }] }]
          },
          { region: region4 }
        ]
      },
      localities,
      adjacencyMap
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Parck'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Parrk'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Paark'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Parck'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Parck'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Parrk'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Parck'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Paark'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[3],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Parrk'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[3],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Parrk'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Paark'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process non-domain region that includes its subregions (which it has)', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData({
        regionID: superregion6.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Parck'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Another Parrk'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Adjacent Paark'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[superregion6.id] = [region4];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: superregion6,
      domainRegions: [region4],
      nondomainRegions: [region0, superregion6, region2, region3],
      regionTree: {
        region: region0,
        children: [
          {
            region: superregion6,
            children: [{ region: region2, children: [{ region: region3 }] }]
          },
          { region: region4 }
        ]
      },
      localities,
      adjacencyMap
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Paark'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[2].name.indexOf('Parck'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Paark'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[3],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Parrk'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('Paark'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process non-domain region that includes its subregions but has none', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData({
        regionID: superregion6.id,
        name: 'Zilker Park'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[superregion6.id] = [region1];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: superregion6,
      domainRegions: [region1],
      nondomainRegions: [region0, superregion6],
      regionTree: {
        region: region0,
        children: [{ region: superregion6 }, { region: region1 }]
      },
      localities,
      adjacencyMap
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      }
    ]);
  });
});

describe('using a baseline date', () => {
  test('processing an in-domain region using a baseline date', async () => {
    const baselineDate = new Date('January 15, 2022');
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker A',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker B',
        lastModified: baselineDate.getTime() // exactly baseline date
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker C',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker D',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Zilker E',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2, region3];

    const matches = await runProcessor({
      baselineDate,
      regionToProcess: region1,
      domainRegions: [region1, region2],
      nondomainRegions: [region0, region3],
      regionTree: {
        region: region0,
        children: [{ region: region1 }, { region: region2 }, { region: region3 }]
      },
      localities,
      adjacencyMap
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[4],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[4],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('processing a non-domain region using a baseline date', async () => {
    const baselineDate = new Date('January 15, 2022');
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker 0',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker 1',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker 2',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker 3',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Zilker 4',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Zilker 5',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region3];

    const matches = await runProcessor({
      baselineDate,
      regionToProcess: region1,
      domainRegions: [region2, region3],
      nondomainRegions: [region0, region1],
      regionTree: {
        region: region0,
        children: [
          { region: region1, children: [{ region: region2 }] },
          { region: region3 }
        ]
      },
      localities,
      adjacencyMap
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[5],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[5],
        phoneticMatches: [zilkerMatch],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('no match processing a non-domain region using a baseline date', async () => {
    const baselineDate = new Date('January 15, 2022');
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker 0',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Zilker 1',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Zilker 2',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Zilker 3',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region3];

    const matches = await runProcessor({
      baselineDate,
      regionToProcess: region1,
      domainRegions: [region2, region3],
      nondomainRegions: [region0, region1],
      regionTree: {
        region: region0,
        children: [
          { region: region1, children: [{ region: region2 }] },
          { region: region3 }
        ]
      },
      localities,
      adjacencyMap
    });

    expect(matches).toEqual([]);
  });
});

describe('phonetically-synonymous locality matching', () => {
  test('process only two single-word synonymous localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Brackenridge'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'BFL'
      })
    ];
    const synonyms: StoredSynonym[][] = [
      [createSynonym(localities[0].name), createSynonym(localities[1].name)]
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process transitively-synonymous localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Brackenridge Tract'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Brack Tract'
      })
    ];
    const synonyms: StoredSynonym[][] = [
      [createSynonym('Brackenridge'), createSynonym('BFL')],
      [createSynonym('BFL'), createSynonym('Brack')]
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Brackenridge'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[1][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: localities[0].name.indexOf('Brack'),
                lastCharIndexPlusOne: 'Brack'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process synonymously-related matching and non-matching multi-word localities', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Austin Nature and Science Center'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Austin Sience & Natur Centre'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'ANSC'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Science Center'
      })
    ];
    const synonyms: StoredSynonym[][] = [
      [createSynonym('Austin Nature and Science Center'), createSynonym('ANSC')]
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms
    });

    const sciencePhoneticSeries = toSortedPhoneticSeries('Science');
    const centerPhoneticSeries = toSortedPhoneticSeries('Center');
    const scienceCenterPhoneticSeries = toSortedPhoneticSeries('Science Center');
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: scienceCenterPhoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 3,
                firstCharIndex: localities[0].name.indexOf('Science Center'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: scienceCenterPhoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: sciencePhoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Sience'),
                lastCharIndexPlusOne: localities[1].name.indexOf(' &')
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: sciencePhoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Science'.length
              }
            ]
          },
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: centerPhoneticSeries,
                firstWordIndex: 3,
                lastWordIndex: 3,
                firstCharIndex: localities[1].name.indexOf('Centre'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: centerPhoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Center'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('comparing localities in reverse order of prior test', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Science Center'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'ANSC'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Austin Sience & Natur Centre'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Austin Nature and Science Center'
      })
    ];
    const synonyms: StoredSynonym[][] = [
      [createSynonym('Austin Nature and Science Center'), createSynonym('ANSC')]
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms
    });

    const sciencePhoneticSeries = toSortedPhoneticSeries('Science');
    const centerPhoneticSeries = toSortedPhoneticSeries('Center');
    const scienceCenterPhoneticSeries = toSortedPhoneticSeries('Science Center');
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: sciencePhoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Science'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: sciencePhoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[2].name.indexOf('Sience'),
                lastCharIndexPlusOne: localities[2].name.indexOf(' &')
              }
            ]
          },
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: centerPhoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[0].name.indexOf('Center'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: centerPhoneticSeries,
                firstWordIndex: 3,
                lastWordIndex: 3,
                firstCharIndex: localities[2].name.indexOf('Centre'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: scienceCenterPhoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: scienceCenterPhoneticSeries,
                firstWordIndex: 2,
                lastWordIndex: 3,
                firstCharIndex: localities[3].name.indexOf('Science'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 3,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process localities multiply matching on a synonym', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'Brackenridge Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'BFL Brack Tract'
      }),
      // reverse the matching order, but use different synonyms
      createLocalityData({
        regionID: region1.id,
        name: 'Valley of Spiders aka Valley of Tarantulas'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Arachnid Canyon'
      })
    ];
    const synonyms: StoredSynonym[][] = [
      [createSynonym('Brackenridge'), createSynonym('BFL')],
      [createSynonym('Brackenridge'), createSynonym('Brack Tract')],
      [createSynonym('Valley of Spiders'), createSynonym('Arachnid Canyon')],
      [createSynonym('Valley of Tarantulas'), createSynonym('Arachnid Canyon')]
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Brackenridge'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[0][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'BFL'.length
              },
              {
                sortedPhoneticSeries: synonyms[1][1].phoneticSeries,
                firstWordIndex: 1,
                lastWordIndex: 2,
                firstCharIndex: localities[1].name.indexOf('Brack'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: synonyms[2][0].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[2].name.indexOf(' aka')
              },
              {
                sortedPhoneticSeries: synonyms[3][0].phoneticSeries,
                firstWordIndex: 3,
                lastWordIndex: 4,
                firstCharIndex: localities[2].name.indexOf('Valley of Tarantulas'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: synonyms[2][1].phoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('synonyms across adjacent regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region1.id,
        name: 'ABC Preserve'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'DEF Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'GHI'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Another JKL'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Child MNO'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];
    adjacencyMap[region2.id] = [region3];
    const synonymousTerms = ['DEF', 'GHI', 'JKL', 'MNO'];
    const synonyms: StoredSynonym[][] = synonymousTerms.map((term) => [
      createSynonym('ABC'),
      createSynonym(term)
    ]);

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region0, region1, region2, region3, region4],
      nondomainRegions: [],
      regionTree: {
        region: region0,
        children: [
          { region: region1, children: [{ region: region4 }] },
          { region: region2 },
          { region: region3 }
        ]
      },
      localities,
      adjacencyMap,
      synonyms
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('ABC'),
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'ABC'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('DEF'),
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'DEF'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('ABC'),
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'ABC'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('GHI'),
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'GHI'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('ABC'),
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'ABC'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('MNO'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[4].name.indexOf('MNO'),
                lastCharIndexPlusOne: localities[4].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
      // No matches between localities[4] and region2 because the adjacency of a parent
      // region does not always imply the adjacency of a child region.
      // No matches with localities[3] in region3 because only immediately adjacent
      // regions are compared; adjacency is not transitive.
    ]);
  });

  test('process synonyms of locality adjoining non-domain regions', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'ABC 123 Preserve'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'DEF 456 Park'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'GHI XYZ'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];
    const synonyms: StoredSynonym[][] = [
      [createSynonym('123 ABC'), createSynonym('456 DEF')],
      [createSynonym('XYZ GHI'), createSynonym('DEF 456')]
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [region0, region2],
      regionTree: {
        region: region0,
        children: [{ region: region1 }, { region: region2 }]
      },
      localities,
      adjacencyMap,
      synonyms
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('DEF 456'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'DEF 456'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('ABC 123'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'ABC 123'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('DEF 456'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'DEF 456'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('XYZ GHI'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'XYZ GHI'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });
});

describe('excluding specified matches', () => {
  test('excluding matches having specified region pairs', async () => {
    const localities = [
      createLocalityData({
        regionID: region0.id,
        name: 'Foo Bar'
      }),
      createLocalityData({
        regionID: region1.id,
        name: 'Foo Bar'
      }),
      createLocalityData({
        regionID: region2.id,
        name: 'Foo Bar'
      }),
      createLocalityData({
        regionID: region3.id,
        name: 'Foo Bar'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Foo Bar'
      }),
      createLocalityData({
        regionID: region4.id,
        name: 'Foo Bar'
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeRegionMatch('foo bar', 1, 2);
    excludedMatchesStore.excludeRegionMatch('foo bar', 1, 3);
    excludedMatchesStore.excludeRegionMatch('foo bar', 1, 4);

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1, region2, region4],
      nondomainRegions: [region0, region3],
      regionTree: {
        region: region0,
        children: [
          { region: region1, children: [{ region: region4 }] },
          { region: region2 },
          { region: region3 }
        ]
      },
      localities,
      adjacencyMap,
      synonyms: [],
      excludedMatchesStore
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('excluding intraregion matches having specified coordinate pairings', async () => {
    const localities = [
      createLocalityData({
        remarks: 'index 0',
        regionID: region0.id,
        name: 'Foo Bar',
        latitude: 11,
        longitude: 21
      }),
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: 'Foo Bar',
        latitude: 10,
        longitude: 20
      }),
      createLocalityData({
        remarks: 'index 2',
        regionID: region1.id,
        name: 'Foo Bar',
        latitude: 10,
        longitude: 20
      }),
      createLocalityData({
        remarks: 'index 3',
        regionID: region1.id,
        name: 'Foo Bar',
        latitude: 11,
        longitude: 21
      }),
      createLocalityData({
        remarks: 'index 4',
        regionID: region1.id,
        name: 'Foo Bar',
        latitude: 12,
        longitude: 22
      }),
      createLocalityData({
        remarks: 'index 5',
        regionID: region1.id,
        name: 'Foo Bar',
        latitude: 13,
        longitude: 23
      }),
      createLocalityData({
        remarks: 'index 6',
        regionID: region1.id,
        name: 'Foo Bar',
        latitude: null,
        longitude: null
      }),
      createLocalityData({
        remarks: 'index 7',
        regionID: region3.id,
        name: 'Foo Bar',
        latitude: 11,
        longitude: 21
      }),
      createLocalityData({
        remarks: 'index 8',
        regionID: region3.id,
        name: 'Foo Bar',
        latitude: 11,
        longitude: 21
      })
    ];
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeCoordinateMatch('foo bar', [10, 20], [11, 21]);
    excludedMatchesStore.excludeCoordinateMatch('foo bar', [10, 20], [12, 22]);

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1, region3],
      nondomainRegions: [region0, region2],
      regionTree: {
        region: region0,
        children: [
          { region: region1, children: [{ region: region3 }] },
          { region: region2 }
        ]
      },
      localities,
      adjacencyMap,
      synonyms: [],
      excludedMatchesStore
    });

    const fooBarPhoneticSeries = toSortedPhoneticSeries('Foo Bar');
    const createMatch = (localityID1: number, localityID2: number) => {
      return {
        baseLocality: localities[localityID1],
        testLocality: localities[localityID2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: fooBarPhoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: fooBarPhoneticSeries,
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      };
    };
    expect(matches).toEqual([
      createMatch(1, 0),
      createMatch(1, 2),
      createMatch(1, 5),
      createMatch(1, 6),
      createMatch(1, 7),
      createMatch(1, 8),
      createMatch(2, 0),
      createMatch(2, 5),
      createMatch(2, 6),
      createMatch(2, 7),
      createMatch(2, 8),
      createMatch(3, 0),
      createMatch(3, 4),
      createMatch(3, 5),
      createMatch(3, 6),
      createMatch(3, 7),
      createMatch(3, 8),
      createMatch(4, 0),
      createMatch(4, 5),
      createMatch(4, 6),
      createMatch(4, 7),
      createMatch(4, 8),
      createMatch(5, 0),
      createMatch(5, 6),
      createMatch(5, 7),
      createMatch(5, 8),
      createMatch(6, 0),
      createMatch(6, 7),
      createMatch(6, 8)
    ]);
  });

  test('identical series exclusions mismatch only in strict subsets', async () => {
    const localities = [
      // Must be first to test base locality subsets of test localties.
      createLocalityData({
        remarks: 'index 0',
        regionID: region1.id,
        name: 'Foo Bar'
      }),
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: 'Foo Bar Baz'
      }),
      createLocalityData({
        remarks: 'index 2',
        regionID: region1.id,
        name: 'Wow Foo Bar'
      }),
      createLocalityData({
        remarks: 'index 3',
        regionID: region1.id,
        name: 'Foo Bar Wow'
      }),
      // Must be last to test test locality subsets of base localities.
      createLocalityData({
        remarks: 'index 4',
        regionID: region1.id,
        name: 'foo bar'
      })
    ];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeWordSeriesMatch('foo bar', 'foo bar');

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms: [],
      excludedMatchesStore
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 1,
                lastWordIndex: 2,
                firstCharIndex: localities[2].name.indexOf('Foo'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'foo bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Wow Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 2,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Wow Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 2,
                firstCharIndex: 0,
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 1,
                lastWordIndex: 2,
                firstCharIndex: localities[2].name.indexOf('Foo'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[3],
        testLocality: localities[4],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('excluding only one of multiple words yields excluded words', async () => {
    const localities = [
      createLocalityData({
        remarks: 'index 0',
        regionID: region1.id,
        name: 'Foo Baz Bar'
      }),
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: 'Yay Bar Foo'
      })
    ];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeWordSeriesMatch('bar', 'bar');

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms: [],
      excludedMatchesStore
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo'),
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo'),
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[1].name.indexOf('Foo'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: [
          [
            {
              sortedPhoneticSeries: toSortedPhoneticSeries('Bar'),
              firstWordIndex: 2,
              lastWordIndex: 2,
              firstCharIndex: localities[0].name.indexOf('Bar'),
              lastCharIndexPlusOne: localities[0].name.length
            },
            {
              sortedPhoneticSeries: toSortedPhoneticSeries('Bar'),
              firstWordIndex: 1,
              lastWordIndex: 1,
              firstCharIndex: localities[1].name.indexOf('Bar'),
              lastCharIndexPlusOne: localities[1].name.indexOf(' Foo')
            }
          ]
        ]
      }
    ]);
  });

  test('excluded matches require exact matches on word series', async () => {
    const localities = [
      createLocalityData({
        remarks: 'index 0',
        regionID: region1.id,
        name: 'Foo Bar Baz'
      }),
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: 'Foo Bar Yay'
      }),
      createLocalityData({
        remarks: 'index 2',
        regionID: region1.id,
        name: 'Foo Barr Blurg Yay'
      })
    ];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeWordSeriesMatch('foo bar', 'foo barr');

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms: [],
      excludedMatchesStore
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Yay'),
                firstWordIndex: 2,
                lastWordIndex: 2,
                firstCharIndex: localities[1].name.indexOf('Yay'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Yay'),
                firstWordIndex: 3,
                lastWordIndex: 3,
                firstCharIndex: localities[2].name.indexOf('Yay'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: [
          [
            {
              sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
              firstWordIndex: 0,
              lastWordIndex: 1,
              firstCharIndex: 0,
              lastCharIndexPlusOne: 'Foo Bar'.length
            },
            {
              sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
              firstWordIndex: 0,
              lastWordIndex: 1,
              firstCharIndex: 0,
              lastCharIndexPlusOne: 'Foo Barr'.length
            }
          ]
        ]
      }
    ]);
  });

  test('only excludes matches of words that are in the same order', async () => {
    const localities = [
      createLocalityData({
        remarks: 'index 0',
        regionID: region1.id,
        name: 'Yay Foo Bar'
      }),
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: 'Bar Foo Chewy'
      }),
      createLocalityData({
        remarks: 'index 2',
        regionID: region1.id,
        name: 'Foo Bar Zoo'
      }),
      createLocalityData({
        remarks: 'index 3',
        regionID: region1.id,
        name: 'Foo Barr Fun'
      })
    ];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeWordSeriesMatch('foo bar', 'foo bar');
    excludedMatchesStore.excludeWordSeriesMatch('foo bar', 'barr foo');

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms: [],
      excludedMatchesStore
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 1,
                lastWordIndex: 2,
                firstCharIndex: 'Yay '.length,
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Bar Foo'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 1,
                lastWordIndex: 2,
                firstCharIndex: 'Yay '.length,
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Barr'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Bar Foo'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Bar Foo'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'foo barr'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Foo Bar'.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Foo Bar'),
                firstWordIndex: 0,
                lastWordIndex: 1,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'foo barr'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('excluding synonymous matches', async () => {
    const localities = [
      createLocalityData({
        remarks: 'index 0',
        regionID: region1.id,
        name: 'Stupendous Park'
      }),
      createLocalityData({
        remarks: 'index 1',
        regionID: region1.id,
        name: 'Amazing Preserve'
      }),
      createLocalityData({
        remarks: 'index 2',
        regionID: region1.id,
        name: 'City PERK'
      }),
      createLocalityData({
        remarks: 'index 3',
        regionID: region1.id,
        name: 'Awesome Preserve'
      })
    ];
    const synonyms: StoredSynonym[][] = [
      [createSynonym('Park'), createSynonym('Preserve')]
    ];
    const excludedMatchesStore = new MockExcludedMatchesStore();
    excludedMatchesStore.excludeWordSeriesMatch('perk', 'preserve');

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: [region1],
      nondomainRegions: [],
      regionTree: { region: region1 },
      localities,
      adjacencyMap: {},
      synonyms,
      excludedMatchesStore
    });

    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Park'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('PERK'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[2].name.indexOf('PERK'),
                lastCharIndexPlusOne: localities[2].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Park'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Preserve'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Preserve'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Park'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[0].name.indexOf('Park'),
                lastCharIndexPlusOne: localities[0].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Preserve'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Preserve'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        phoneticMatches: [
          {
            baseSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Preserve'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[1].name.indexOf('Preserve'),
                lastCharIndexPlusOne: localities[1].name.length
              }
            ],
            testSubsets: [
              {
                sortedPhoneticSeries: toSortedPhoneticSeries('Preserve'),
                firstWordIndex: 1,
                lastWordIndex: 1,
                firstCharIndex: localities[3].name.indexOf('Preserve'),
                lastCharIndexPlusOne: localities[3].name.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });
});

//// TEST SUPPPORT ///////////////////////////////////////////////////////////

class TestRegion extends Region {
  static regionID = 0;

  constructor(name: string, processSubregions: boolean) {
    super(TestRegion.regionID++, RegionRank.County, name, 0);
    this.flags = processSubregions ? PROCESS_SUBREGIONS_FLAG : 0;
  }
}

const region0 = new TestRegion('Texas', false);
const region1 = new TestRegion('Travis County', false);
const region2 = new TestRegion('Bastrop County', false);
const region3 = new TestRegion('Hays County', false);
const region4 = new TestRegion('Burnet County', false);
const region5 = new TestRegion('Blanco County', false);
const superregion6 = new TestRegion('Some State', true);

class MockLocalityCache implements LocalityCache {
  private _phoneticCodeIndex: MockPhoneticCodeIndex;
  private _localitiesByRegionID: Record<number, CachedLocality[]> = {};
  private _cachedLocalities: Record<number, CachedLocality> = {};

  constructor(phoneticCodeIndex: MockPhoneticCodeIndex, localities: CachedLocality[]) {
    this._phoneticCodeIndex = phoneticCodeIndex;
    for (const locality of localities) {
      this._phoneticCodeIndex.addLocality(locality);
      let regionLocalities = this._localitiesByRegionID[locality.regionID];
      if (!regionLocalities) {
        regionLocalities = [];
        this._localitiesByRegionID[locality.regionID] = regionLocalities;
      }
      regionLocalities.push(locality);
      this._cachedLocalities[locality.localityID] = locality;
    }
  }

  async cacheRegionLocalities(_region: TrackedRegion): Promise<void> {
    // not needed for this test suite
  }

  async getLocality(localityID: number): Promise<CachedLocality> {
    return this._cachedLocalities[localityID];
  }

  async *localitiesOfRegion(
    region: TrackedRegion
  ): AsyncGenerator<CachedLocality, void, void> {
    const localities = this._localitiesByRegionID[region.id];
    if (localities) {
      for (const locality of localities) {
        yield locality;
      }
    }
  }

  async uncacheLocality(localityID: number): Promise<void> {
    const locality = this._cachedLocalities[localityID];
    if (locality) {
      delete this._cachedLocalities[localityID];
      await this._phoneticCodeIndex.removeLocality(locality);
    }
  }
}

function assignLocalityCounts(
  regionNode: Partial<RegionNode>,
  localities: Partial<LocalityData>[]
): void {
  regionNode.localityCount = 0;
  for (const locality of localities) {
    if (locality.regionID == regionNode.region!.id) {
      ++regionNode.localityCount;
    }
  }
  if (regionNode.children) {
    for (const child of regionNode.children) {
      assignLocalityCounts(child, localities);
    }
  }
}

function completeAdjacencies(regions: Region[], adjacencyMap: AdjacencyMap): void {
  const regionMap: Record<number, Region> = {};
  for (const region of regions) {
    regionMap[region.id] = region;
  }
  for (const indexedRegionID of Object.keys(adjacencyMap)) {
    const indexedRegionIDNum = parseInt(indexedRegionID);
    for (const providedAdjacentRegion of adjacencyMap[indexedRegionIDNum]) {
      let impliedAdjacentRegions = adjacencyMap[providedAdjacentRegion.id];
      if (!impliedAdjacentRegions) {
        impliedAdjacentRegions = [];
        adjacencyMap[providedAdjacentRegion.id] = impliedAdjacentRegions;
      }
      const impliedAdjacentRegion = regionMap[indexedRegionIDNum];
      if (!impliedAdjacentRegions.includes(impliedAdjacentRegion)) {
        impliedAdjacentRegions.push(impliedAdjacentRegion);
      }
    }
  }
}

let localityID = 100;
function createLocalityData(data: Partial<LocalityData>): LocalityData {
  return Object.assign(
    {},
    {
      latitude: null,
      longitude: null,
      remarks: '',
      lastModified: new Date('1-Jan-2022').getTime()
    },
    data,
    {
      localityID: localityID++
    }
  ) as LocalityData;
}

// Assumes that all ignored words have been removed from phrase.
function createSynonym(fromPhrase: string): StoredSynonym {
  return {
    originalWordSeries: fromPhrase.toLocaleLowerCase(),
    phoneticSeries: toSortedPhoneticSeries(fromPhrase)
  };
}

function purgeCachedWordSeries(localityMatch: LocalityMatch): void {
  for (const phoneticMatch of localityMatch.phoneticMatches) {
    for (const phoneticSubset of phoneticMatch.baseSubsets) {
      delete phoneticSubset.cachedWordSeries;
    }
    for (const phoneticSubset of phoneticMatch.testSubsets) {
      delete phoneticSubset.cachedWordSeries;
    }
  }
  for (const excludedSubsetPair of localityMatch.excludedSubsetPairs) {
    delete excludedSubsetPair[0].cachedWordSeries;
    delete excludedSubsetPair[1].cachedWordSeries;
  }
}

async function runProcessor(config: {
  baselineDate: Date | null;
  regionToProcess: Region;
  domainRegions: Region[];
  nondomainRegions: Region[];
  regionTree: RegionNode;
  localities: LocalityData[];
  adjacencyMap?: AdjacencyMap;
  synonyms?: StoredSynonym[][];
  excludedMatchesStore?: ExcludedMatchesStore;
}): Promise<LocalityMatch[]> {
  const allRegions = config.domainRegions.concat(config.nondomainRegions);
  verifyRegions(allRegions, config.regionTree, config.localities);
  assignLocalityCounts(config.regionTree, config.localities);
  if (config.adjacencyMap) {
    completeAdjacencies(allRegions, config.adjacencyMap);
  }

  const regionAccess = new MockRegionAccess(
    config.regionTree as RegionNode,
    config.adjacencyMap || {}
  );
  const regionRoster = new MockTrackedRegionRoster();
  for (const region of config.domainRegions) {
    await regionRoster.getOrCreate(region, true);
  }
  for (const region of config.nondomainRegions) {
    await regionRoster.getOrCreate(region, false);
  }

  const phoneticCodeIndex = new MockPhoneticCodeIndex();
  const potentialSynonymsStore = new MockPotentialSynonymsStore(phoneticCodeIndex);
  if (config.synonyms) {
    for (const synonymPair of config.synonyms) {
      potentialSynonymsStore.addSynonym(synonymPair[0], synonymPair[1]);
    }
  }

  const processor = new RegionProcessor(
    regionAccess,
    new MockLocalityCache(
      phoneticCodeIndex,
      config.localities.map((data) => new CachedLocality(data))
    ),
    potentialSynonymsStore,
    phoneticCodeIndex,
    regionRoster,
    config.excludedMatchesStore || new MockExcludedMatchesStore()
  );

  const matches: LocalityMatch[] = [];
  for await (const match of processor.run(
    config.baselineDate,
    (await regionRoster.getByID(config.regionToProcess.id))!
  )) {
    purgeCachedWordSeries(match);
    matches.push(match);
  }
  return matches;
}

function verifyRegions(
  regions: Region[],
  regionTree: RegionNode,
  localities: LocalityData[]
): void {
  const listRegionIDs = regions.map((region) => region.id);
  const treeRegions = verifyRegionNode(regions, regionTree);
  const treeRegionIDs = treeRegions.map((region) => region.id);

  for (const locality of localities) {
    if (!listRegionIDs.includes(locality.regionID)) {
      throw Error(`Locality '${locality.name}' region not in region lists`);
    }
    if (!treeRegionIDs.includes(locality.regionID)) {
      throw Error(`Locality '${locality.name}' region not in provided tree`);
    }
  }
}

function verifyRegionNode(regions: Region[], regionNode: RegionNode): Region[] {
  if (!regions.includes(regionNode.region)) {
    throw Error(`Region node "${regionNode.region.name}" not in region lists`);
  }
  const collectedRegions: Region[] = [regionNode.region];
  if (regionNode.children) {
    for (const child of regionNode.children) {
      collectedRegions.push(...verifyRegionNode(regions, child));
    }
  }
  return collectedRegions;
}
