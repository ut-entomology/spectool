import { Region } from '../../shared/region';

export interface AdjoiningRegions {
  getAdjacentRegions(toGeographyID: number): Region[];

  getContainingRegions(aboveGeographyID: number): Region[];

  getDescendantRegions(underGeographyID: number): Region[];

  getLocalityCount(forSingleGeographicID: number): number;
}
