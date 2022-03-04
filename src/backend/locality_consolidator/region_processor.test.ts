import type { CachedLocality } from './cached_locality';
import type { LocalityCache } from './locality_cache';
import { TrackedRegion } from './tracked_region';
import type {
  LocalityMatch,
  PhoneticMatch,
  PhoneticSubset
} from '../../shared/shared_locality';
import { RegionProcessor } from './region_processor';
import { Region, RegionRank } from '../../shared/shared_geography';
import { MockRegionAccess } from './mock/mock_region_access';
import { MockTrackedRegionRoster } from './mock/mock_region_roster';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';
import { MockPotentialSynonymsStore } from './mock/mock_potential_synonyms';
import { MockExcludedMatchesStore } from './mock/mock_excluded_matches';

test('process isolated region, isolated locality', () => {
  const region1 = new Region(1, RegionRank.County, 'Travis County', 0);
  const regionAccess = new MockRegionAccess(
    {
      region: region1,
      localityCount: 1
    },
    {}
  );
  const processor = new RegionProcessor(
    regionAccess,
    localityCache,
    new MockPotentialSynonymsStore(),
    new MockPhoneticCodeIndex(),
    new MockTrackedRegionRoster(),
    new MockExcludedMatchesStore()
  );
});
