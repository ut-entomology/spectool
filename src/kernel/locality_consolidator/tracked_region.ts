import { Region, RegionRank } from '../../shared/region';

export enum TrackedRegionStatus {
  Pending,
  Cached,
  Complete
}

export class TrackedRegion {
  id: number; // geography ID
  rank: RegionRank;
  inDomain: boolean;
  localityTotal: number;
  status = TrackedRegionStatus.Pending;
  adjoiningPendingCount = 0;

  constructor(region: Region, inDomain: boolean, localityTotal: number) {
    this.id = region.id;
    this.rank = region.rank;
    this.inDomain = inDomain;
    this.localityTotal = localityTotal;
  }
}
