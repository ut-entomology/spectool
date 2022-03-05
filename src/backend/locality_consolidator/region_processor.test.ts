import { CachedLocality } from './cached_locality';
import type { LocalityCache } from './locality_cache';
import type { TrackedRegion } from './tracked_region';
import { RegionProcessor } from './region_processor';
import { Region, RegionRank } from '../../shared/shared_geography';
import { MockRegionAccess } from './mock/mock_region_access';
import { MockTrackedRegionRoster } from './mock/mock_tracked_region_roster';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';
import { MockPotentialSynonymsStore } from './mock/mock_potential_synonyms';
import { MockExcludedMatchesStore } from './mock/mock_excluded_matches';
import { PROCESS_SUBREGIONS_FLAG } from '../util/region_adjacencies';
import type { LocalityMatch } from '../../shared/shared_locality';
import { toPartialSortedPhoneticSeries } from './mock/phonetic_util';

test('process isolated region, isolated locality', async () => {
  const region1 = new TestRegion(1, 'Travis County', false);
  const regionAccess = new MockRegionAccess(
    {
      region: region1,
      localityCount: 2
    },
    {}
  );
  const phoneticCodeIndex = new MockPhoneticCodeIndex();
  const regionRoster = new MockTrackedRegionRoster();
  regionRoster.getOrCreate(region1, true);
  const trackedRegion1 = await regionRoster.getOrCreate(region1, true);
  const localities = [
    new CachedLocality(
      trackedRegion1,
      10,
      null,
      null,
      'Zilker Preserve',
      '',
      new Date('1-Jan-2022').getTime()
    ),
    new CachedLocality(
      trackedRegion1,
      11,
      null,
      null,
      'Zilker Park',
      '',
      new Date('1-Jan-2022').getTime()
    )
  ];

  const processor = new RegionProcessor(
    regionAccess,
    new MockLocalityCache(phoneticCodeIndex, localities),
    new MockPotentialSynonymsStore(),
    phoneticCodeIndex,
    regionRoster,
    new MockExcludedMatchesStore()
  );

  const matches: LocalityMatch[] = [];
  for await (const match of processor.run(null, trackedRegion1)) {
    purgeCachedWordSeries(match);
    matches.push(match);
  }
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
