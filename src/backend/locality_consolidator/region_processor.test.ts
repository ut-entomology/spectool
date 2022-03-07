import { CachedLocality } from './cached_locality';
import type { LocalityCache } from './locality_cache';
import type { TrackedRegion } from './tracked_region';
import { RegionProcessor } from './region_processor';
import { Region, RegionRank } from '../../shared/shared_geography';
import { MockRegionAccess, RegionNode } from './mock/mock_region_access';
import { MockTrackedRegionRoster } from './mock/mock_tracked_region_roster';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';
import { MockPotentialSynonymsStore } from './mock/mock_potential_synonyms';
import { MockExcludedMatchesStore } from './mock/mock_excluded_matches';
import { PROCESS_SUBREGIONS_FLAG } from '../util/region_adjacencies';
import type { LocalityMatch, LocalityData } from '../../shared/shared_locality';
import {
  toPartialSortedPhoneticSeries,
  toSortedPhoneticSeries
} from './mock/phonetic_util';

type AdjacencyMap = Record<number, Region[]>;

const localityDefaults = {
  latitude: null,
  longitude: null,
  remarks: '',
  lastModified: new Date('1-Jan-2022').getTime()
};

describe('no matches', () => {
  test('process isolated region, isolated locality', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    expect(matches).toEqual([]);
  });

  test('process three non-matching localities', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Austin Nature and Science Center'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    expect(matches).toEqual([]);
  });

  test('no match across non-adjoining regions', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    expect(matches).toEqual([]);
  });
});

describe('phonetic locality matching', () => {
  test('process only two single-word matching localities', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('process three single-word matching localities', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Nature Park and Nature Preserve'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Park at Zilker Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    const zilkerSeries = toSortedPhoneticSeries('zilker');
    const parkSeries = toSortedPhoneticSeries('park');
    const naturePreserveSeries = toSortedPhoneticSeries('nature preserve');
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        matches: [
          {
            sortedPhoneticSeries: zilkerSeries,
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
            sortedPhoneticSeries: parkSeries,
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
        matches: [
          {
            sortedPhoneticSeries: naturePreserveSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker'
      }),
      createLocalityData(localityDefaults, {
        regionID: region3.id,
        name: 'Another Zilker'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[4],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[1],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap: {},
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[2],
        testLocality: localities[0],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region0.id,
        name: 'Zilker Preserve'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });
});

describe('processing non-domain regions with no baseline date', () => {
  test('matches only adjoining in-domain regions', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Austin City Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region3.id,
        name: 'Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region4.id,
        name: 'Another Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region5.id,
        name: 'Non-Domain Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const wordSeries = 'Zilker Park';
    const phoneticSeries = toSortedPhoneticSeries(wordSeries);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
      createLocalityData(localityDefaults, {
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: superregion6.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Parck'
      }),
      createLocalityData(localityDefaults, {
        regionID: region3.id,
        name: 'Another Parrk'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[0],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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

  test('process non-domain region that includes its subregions', async () => {
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region0.id,
        name: 'Austin City Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: superregion6.id,
        name: 'Zilker Park'
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Parck'
      }),
      createLocalityData(localityDefaults, {
        regionID: region3.id,
        name: 'Another Parrk'
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toSortedPhoneticSeries('park');
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[4],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
});

describe('using a baseline date', () => {
  test('processing an in-domain region using a baseline date', async () => {
    const baselineDate = new Date('January 15, 2022');
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker A',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker B',
        lastModified: baselineDate.getTime() // exactly baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker C',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker D',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[3],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[4],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[3],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[2],
        testLocality: localities[4],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      }
    ]);
  });

  test('processing a non-domain region using a baseline date', async () => {
    const baselineDate = new Date('January 15, 2022');
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker 0',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker 1',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker 2',
        lastModified: new Date('January 30, 2022').getTime() // after baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region2.id,
        name: 'Zilker 3',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData(localityDefaults, {
        regionID: region3.id,
        name: 'Zilker 4',
        lastModified: new Date('January 1, 2022').getTime() // before baseline date
      }),
      createLocalityData(localityDefaults, {
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
      adjacencyMap,
      localities
    });

    const phoneticSeries = toPartialSortedPhoneticSeries(localities[0].name, 0, 0);
    expect(matches).toEqual([
      {
        baseLocality: localities[0],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[0],
        testLocality: localities[5],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[2],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
              }
            ]
          }
        ],
        excludedSubsetPairs: []
      },
      {
        baseLocality: localities[1],
        testLocality: localities[5],
        matches: [
          {
            sortedPhoneticSeries: phoneticSeries,
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
                firstWordIndex: 0,
                lastWordIndex: 0,
                firstCharIndex: 0,
                lastCharIndexPlusOne: 'Zilker'.length
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
function createLocalityData(
  defaultData: Partial<LocalityData>,
  data: Partial<LocalityData>
): LocalityData {
  return Object.assign({}, defaultData, data, {
    localityID: localityID++
  }) as LocalityData;
}

function purgeCachedWordSeries(localityMatch: LocalityMatch): void {
  for (const phoneticMatch of localityMatch.matches) {
    for (const phoneticSubset of phoneticMatch.baseSubsets) {
      delete phoneticSubset.cachedWordSeries;
    }
    for (const phoneticSubset of phoneticMatch.testSubsets) {
      delete phoneticSubset.cachedWordSeries;
    }
  }
}

async function runProcessor(config: {
  baselineDate: Date | null;
  regionToProcess: Region;
  domainRegions: Region[];
  nondomainRegions: Region[];
  regionTree: RegionNode;
  adjacencyMap: AdjacencyMap;
  localities: LocalityData[];
}): Promise<LocalityMatch[]> {
  const allRegions = config.domainRegions.concat(config.nondomainRegions);
  verifyRegions(allRegions, config.regionTree, config.localities);
  assignLocalityCounts(config.regionTree, config.localities);
  completeAdjacencies(allRegions, config.adjacencyMap);

  const regionAccess = new MockRegionAccess(
    config.regionTree as RegionNode,
    config.adjacencyMap
  );
  const phoneticCodeIndex = new MockPhoneticCodeIndex();
  const regionRoster = new MockTrackedRegionRoster();

  for (const region of config.domainRegions) {
    await regionRoster.getOrCreate(region, true);
  }
  for (const region of config.nondomainRegions) {
    await regionRoster.getOrCreate(region, false);
  }

  const processor = new RegionProcessor(
    regionAccess,
    new MockLocalityCache(
      phoneticCodeIndex,
      config.localities.map((data) => new CachedLocality(data))
    ),
    new MockPotentialSynonymsStore(),
    phoneticCodeIndex,
    regionRoster,
    new MockExcludedMatchesStore()
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
