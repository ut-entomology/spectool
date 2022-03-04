import type { Region, RegionRank } from '../../shared/shared_geography';
import { PROCESS_SUBREGIONS_FLAG } from '../util/region_adjacencies';

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
  processSubregions: boolean;

  constructor(region: Region, inDomain: boolean) {
    this.id = region.id;
    this.rank = region.rank;
    this.inDomain = inDomain;
    this.processSubregions = !!(region.flags & PROCESS_SUBREGIONS_FLAG);
  }
}
