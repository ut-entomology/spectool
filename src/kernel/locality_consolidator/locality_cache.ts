import { CachedLocality } from './cached_locality';
import { TrackedRegion } from './tracked_region';

export interface LocalityCache {
  cacheRegionLocalities(region: TrackedRegion): void;

  getLocality(localityID: number): CachedLocality;

  localitiesOfRegion(region: TrackedRegion): AsyncGenerator<CachedLocality, void, void>;

  uncacheLocality(localityID: number): void;
}
