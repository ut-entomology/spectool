import { Region } from '../../shared/region';

export interface AdjoiningRegions {
  getAdjacentRegions(toGeographyID: number): Region[];

  getContainingGeographyIDs(aboveGeographyID: number): number[];

  getDescendantGeographyIDs(underGeographyID: number): number[];

  getLocalityCount(inAndUnderGeographicID: number): number;
}
