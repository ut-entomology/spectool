export const SPECIFY_USA = 'United States'; // how Specify names U.S.A.

export type GeoDictionary = { [id: number]: { id: number; name: string } };

export enum RegionRank {
  Earth,
  Continent,
  Country,
  State,
  County
}

export class Region {
  id: number; // a Specify GeographyID
  rank: RegionRank;
  name: string;
  exactName: string;
  parentID: number;
  flags = 0; // flags vary with use

  constructor(id: number, rank: RegionRank, name: string, parentID: number) {
    this.id = id;
    this.rank = rank;
    this.name = name.trim();
    this.exactName = name;
    this.parentID = parentID;
  }
}

export interface Locality {
  localityID: number;
  latitude1: number;
  longitude1: number;
  localityName: string;
}
