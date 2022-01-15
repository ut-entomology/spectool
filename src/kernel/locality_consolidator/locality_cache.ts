import { TrackedRegion } from './tracked_region';

export interface CachedLocality {
  localityID: number;
  regionID: number;
  lastModified: number; // UNIX time
  latitude: number;
  longitude: number;
  name: string;
  phonemes: string;
  remarks: string;
}

export interface LocalityCache {
  cacheRegionLocalities(region: TrackedRegion): void;

  getLocality(localityID: number): CachedLocality;

  uncacheLocality(localityID: number): void;
}
