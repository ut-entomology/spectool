import type { Region } from '../../shared/shared_geography';

export interface RegionAccess {
  getAdjacentRegions(toGeographyID: number): Region[];

  getContainingRegions(aboveGeographyID: number): Region[];

  getContainedRegions(underGeographyID: number): Region[];

  /**
   * Returns the number of localities indicating that the region of the provided
   * ID is the most specific region to which the locality belongs.
   */
  getLocalityCount(forSingleGeographicID: number): number;
}
