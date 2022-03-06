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
import { toPartialSortedPhoneticSeries } from './mock/phonetic_util';

const localityDefaults = {
  latitude: null,
  longitude: null,
  remarks: '',
  lastModified: new Date('1-Jan-2022').getTime()
};

test('process isolated region, isolated locality', async () => {
  const regions = [new TestRegion(1, 'Travis County', false)];
  const localities = [
    new CachedLocality(
      Object.assign({}, localityDefaults, {
        regionID: regions[0].id,
        localityID: 10,
        name: 'Zilker Preserve'
      })
    )
  ];

  const matches = await runProcessor({
    baselineDate: null,
    regionToProcess: regions[0],
    domainRegions: regions,
    nondomainRegions: [],
    regionTree: {
      region: regions[0],
      localityCount: localities.length
    },
    adjacencyMap: {},
    localities
  });

  expect(matches).toEqual([]);
});

describe('phonetic locality matching', () => {
  test('process only two single-word matching localities', async () => {
    const regions = [new TestRegion(1, 'Travis County', false)];
    const localities: LocalityData[] = [
      Object.assign({}, localityDefaults, {
        regionID: regions[0].id,
        localityID: 10,
        name: 'Zilker Preserve'
      }),
      Object.assign({}, localityDefaults, {
        regionID: regions[0].id,
        localityID: 11,
        name: 'Zilker Park'
      })
    ];

    const matches = await runProcessor({
      baselineDate: null,
      regionToProcess: regions[0],
      domainRegions: regions,
      nondomainRegions: [],
      regionTree: {
        region: regions[0],
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
});

//// TEST SUPPPORT ///////////////////////////////////////////////////////////

class TestRegion extends Region {
  constructor(id: number, name: string, processSubregions: boolean) {
    super(id, RegionRank.County, name, 0);
    this.flags = processSubregions ? PROCESS_SUBREGIONS_FLAG : 0;
  }
}

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
  adjacencyMap: Record<number, Region[]>;
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
