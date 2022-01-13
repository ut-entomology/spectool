import { TrackedRegion } from './tracked_region';

export class RegionRoster {
  private _regions: TrackedRegion[] = [];
  private _regionsByID: Record<number, TrackedRegion> = {};

  add(region: TrackedRegion): void {
    this._regions.push(region);
    this._regionsByID[region.id] = region;
  }

  getArbitraryRegion(): TrackedRegion {
    return this._regions[0];
  }

  getByID(geographyID: number): TrackedRegion {
    return this._regionsByID[geographyID];
  }

  includes(region: TrackedRegion): boolean {
    return this._regions.includes(region);
  }

  [Symbol.iterator]() {
    const self = this;
    let next_index = 0;
    return {
      next: () => {
        return {
          done: next_index == self._regions.length,
          value: self._regions[next_index++]
        };
      }
    };
  }

  remove(region: TrackedRegion): void {
    const index = this._regions.indexOf(region);
    this._regions.splice(index, 1);
  }
}
