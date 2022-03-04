import type { CachedLocality } from './cached_locality';
import type { TrackedRegion } from './tracked_region';

export interface LocalityCache {
  cacheRegionLocalities(region: TrackedRegion): Promise<void>;

  // TODO: Should probably have a null return, in case locality gets deleted in the interim.
  getLocality(localityID: number): Promise<CachedLocality>;

  localitiesOfRegion(region: TrackedRegion): AsyncGenerator<CachedLocality, void, void>;

  uncacheLocality(localityID: number): Promise<void>;
}
