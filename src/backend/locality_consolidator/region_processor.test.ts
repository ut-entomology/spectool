import type { CachedLocality } from './cached_locality';
import type { LocalityCache } from './locality_cache';
import type { TrackedRegion } from './tracked_region';
import { RegionProcessor } from './region_processor';
import { Region, RegionRank } from '../../shared/shared_geography';
import { MockRegionAccess } from './mock/mock_region_access';
import { MockTrackedRegionRoster } from './mock/mock_region_roster';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';
import { MockPotentialSynonymsStore } from './mock/mock_potential_synonyms';
import { MockExcludedMatchesStore } from './mock/mock_excluded_matches';
import { PROCESS_SUBREGIONS_FLAG } from '../util/region_adjacencies';
import type {
  LocalityMatch,
  PhoneticMatch,
  PhoneticSubset
} from '../../shared/shared_locality';

test('process isolated region, isolated locality', () => {
  const region1 = new Region(1, RegionRank.County, 'Travis County', 0);
  const regionAccess = new MockRegionAccess(
    {
      region: region1,
      localityCount: 1
    },
    {}
  );
  const phoneticCodeIndex = new MockPhoneticCodeIndex();
  const processor = new RegionProcessor(
    regionAccess,
    new MockLocalityCache(phoneticCodeIndex),
    new MockPotentialSynonymsStore(),
    phoneticCodeIndex,
    new MockTrackedRegionRoster(),
    new MockExcludedMatchesStore()
  );
});

class MockRegion {
  id: number;
  mame: string;
  flags: number;

  constructor(id: number, name: string, processSubregions: boolean) {
    this.id = id;
    this.mame = name;
    this.flags = processSubregions ? PROCESS_SUBREGIONS_FLAG : 0;
  }
}

class MockLocalityCache implements LocalityCache {
  private _phoneticCodeIndex: MockPhoneticCodeIndex;
  private _cachedLocalities: Record<number, CachedLocality> = {};

  constructor(phoneticCodeIndex: MockPhoneticCodeIndex) {
    this._phoneticCodeIndex = phoneticCodeIndex;
  }

  //// INTERFACE LocalityCache ///////////////////////////////////////////////

  async cacheRegionLocalities(region: TrackedRegion): Promise<void> {
    //
  }

  async getLocality(localityID: number): Promise<CachedLocality> {
    return this._cachedLocalities[localityID];
  }

  async *localitiesOfRegion(
    region: TrackedRegion
  ): AsyncGenerator<CachedLocality, void, void> {
    //
  }

  async uncacheLocality(localityID: number): Promise<void> {
    //
  }

  //// Mock Support //////////////////////////////////////////////////////////
}
