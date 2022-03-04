import type { CachedLocality } from './cached_locality';
import type { TrackedRegion } from './tracked_region';

export interface LocalityCache {
  cacheRegionLocalities(region: TrackedRegion): Promise<void>;

  getLocality(localityID: number): Promise<CachedLocality>;

  localitiesOfRegion(region: TrackedRegion): AsyncGenerator<CachedLocality, void, void>;

  uncacheLocality(localityID: number): Promise<void>;
}
