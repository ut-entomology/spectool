import type { TrackedRegionRoster } from '../region_roster';
import type { TrackedRegion } from '../tracked_region';

export class MockTrackedRegionRoster implements TrackedRegionRoster {
  private _regions: TrackedRegion[] = [];
  private _regionsByID: Record<number, TrackedRegion> = {};

  async add(region: TrackedRegion): Promise<void> {
    this._regions.push(region);
    this._regionsByID[region.id] = region;
  }

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

  async includes(region: TrackedRegion): Promise<boolean> {
    return this._regions.includes(region);
  }

  async remove(region: TrackedRegion): Promise<void> {
    const index = this._regions.indexOf(region);
    this._regions.splice(index, 1);
  }
}
