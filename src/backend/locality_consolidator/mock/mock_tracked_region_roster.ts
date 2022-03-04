import type { Region } from '../../../shared/shared_geography';
import type { TrackedRegionRoster } from '../tracked_region_roster';
import { TrackedRegion } from '../tracked_region';

export class MockTrackedRegionRoster implements TrackedRegionRoster {
  private _regions: TrackedRegion[] = [];
  private _regionsByID: Record<number, TrackedRegion> = {};

  async *allRegions() {
    for (const region of this._regions) {
      yield region;
    }
  }

  async getArbitraryRegion(): Promise<TrackedRegion> {
    return this._regions[0];
  }

  async getByID(geographyID: number): Promise<TrackedRegion | null> {
    return this._regionsByID[geographyID] || null;
  }

  async getOrCreate(region: Region, inDomain: boolean): Promise<TrackedRegion> {
    let trackedRegion = await this.getByID(region.id);
    if (!trackedRegion) {
      trackedRegion = new TrackedRegion(region, inDomain);
      this._regions.push(trackedRegion);
      this._regionsByID[region.id] = trackedRegion;
    }
    return trackedRegion;
  }

  async includes(region: TrackedRegion): Promise<boolean> {
    return this._regions.includes(region);
  }

  async remove(region: TrackedRegion): Promise<void> {
    const index = this._regions.indexOf(region);
    this._regions.splice(index, 1);
  }
}
