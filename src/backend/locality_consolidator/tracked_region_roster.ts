import type { Region } from '../../shared/shared_geography';
import type { TrackedRegion } from './tracked_region';

export interface TrackedRegionRoster {
  allRegions(): AsyncGenerator<TrackedRegion, void, void>;

  getArbitraryRegion(): Promise<TrackedRegion>;

  getByID(geographyID: number): Promise<TrackedRegion | null>;

  getOrCreate(region: Region, inDomain: boolean): Promise<TrackedRegion>;

  includes(region: TrackedRegion): Promise<boolean>;

  remove(region: TrackedRegion): Promise<void>;
}
