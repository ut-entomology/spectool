import { TrackedRegion } from './tracked_region';

export interface CachedLocality {
  localityID: number;
  regionID: number;
  lastModified: Date;
  latitude: number;
  longitude: number;
  name: string;
  phonemes: string;
  remarks: string;
}

export class LocalityCache {
  cacheRegionLocalities(region: TrackedRegion): void {
    // TBD
  }

  getLocality(localityID: number): CachedLocality {
    // TBD
  }

  uncacheLocality(localityID: number): void {
    // TBD
  }
}
