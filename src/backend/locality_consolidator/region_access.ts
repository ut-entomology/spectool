import type { Region } from '../../shared/shared_geography';

export interface RegionAccess {
  getAdjacentRegions(toGeographyID: number): Region[];

  getContainingRegions(aboveGeographyID: number): Region[];

  getContainedRegions(underGeographyID: number): Region[];

  getLocalityCount(forSingleGeographicID: number): number;
}
