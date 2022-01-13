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

export class LocalityCache {
  private _cache: Record<number, CachedLocality> = {};

  cacheRegionLocalities(region: TrackedRegion): void {
    this._cache[region.id] = {
      localityID: region.id,
      regionID: region.id,
      lastModified: Date.now(),
      latitude: 0,
      longitude: 0,
      name: 'Dummy Locality Name',
      phonemes: '',
      remarks: ''
    };
  }

  getLocality(localityID: number): CachedLocality {
    return this._cache[localityID];
  }

  uncacheLocality(localityID: number): void {
    delete this._cache[localityID];
  }
}
