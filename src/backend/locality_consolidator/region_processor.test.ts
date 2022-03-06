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
    const regions = [region1];
    const localities = [
      createLocalityData(localityDefaults, {
        regionID: region1.id,
        name: 'Zilker Preserve'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region1,
        localityCount: localities.length
      },
      adjacencyMap: {},
      localities
    });

    expect(matches).toEqual([]);
  });

  test('process three non-matching localities', async () => {
    const regions = [region1];
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
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region1,
        localityCount: localities.length
      },
      adjacencyMap: {},
      localities
    });

    expect(matches).toEqual([]);
  });

  test('no match across non-adjoining regions', async () => {
    const regions = [region0, region1, region2];
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
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region0,
        localityCount: localities.length,
        children: [
          {
            region: region1,
            localityCount: 1
          },
          {
            region: region2,
            localityCount: 1
          }
        ]
      },
      adjacencyMap: {},
      localities
    });

    expect(matches).toEqual([]);
  });
});

describe('phonetic locality matching', () => {
  test('process only two single-word matching localities', async () => {
    const regions = [region1];
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
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region1,
        localityCount: localities.length
      },
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
    const regions = [region1];
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
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region1,
        localityCount: localities.length
      },
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
    const regions = [region1];
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
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region1,
        localityCount: localities.length
      },
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

  test('phonetic match across adjacent regions', async () => {
    const regions = [region0, region1, region2];
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
    const adjacencyMap: AdjacencyMap = {};
    adjacencyMap[region1.id] = [region2];
    adjacencyMap[region2.id] = [region1];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: region1,
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: region0,
        localityCount: localities.length,
        children: [
          {
            region: region1,
            localityCount: 1
          },
          {
            region: region2,
            localityCount: 1
          }
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
      }
    ]);
  });
});

//// TEST SUPPPORT ///////////////////////////////////////////////////////////

class TestRegion extends Region {
  static regionID = 1;

  constructor(name: string, processSubregions: boolean) {
    super(TestRegion.regionID++, RegionRank.County, name, 0);
    this.flags = processSubregions ? PROCESS_SUBREGIONS_FLAG : 0;
  }
}

const region0 = new TestRegion('Texas', false);
const region1 = new TestRegion('Travis County', false);
const region2 = new TestRegion('Bastrop County', false);

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
  const regionAccess = new MockRegionAccess(config.regionTree, config.adjacencyMap);
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
