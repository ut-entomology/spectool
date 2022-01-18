import { Region, RegionRank } from '../../shared/shared_geography';

export enum TrackedRegionStatus {
  Pending,
  Cached,
  Complete
}

export class TrackedRegion {
  id: number; // geography ID
  rank: RegionRank;
  inDomain: boolean;
  localityTotal: number | null = null;
  status = TrackedRegionStatus.Pending;
  adjoiningPendingCount = 0;

  constructor(region: Region, inDomain: boolean) {
    this.id = region.id;
    this.rank = region.rank;
    this.inDomain = inDomain;
  }
}
