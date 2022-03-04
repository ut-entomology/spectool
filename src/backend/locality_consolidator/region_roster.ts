import type { TrackedRegion } from './tracked_region';

export interface TrackedRegionRoster {
  add(region: TrackedRegion): Promise<void>;

  allRegions(): AsyncGenerator<TrackedRegion, void, void>;

  getArbitraryRegion(): Promise<TrackedRegion>;

  getByID(geographyID: number): Promise<TrackedRegion | null>;

  includes(region: TrackedRegion): Promise<boolean>;

  remove(region: TrackedRegion): Promise<void>;
}
