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

  constructor(id: number, rank: RegionRank, name: string, parentID: number) {
    this.id = id;
    this.rank = rank;
    this.name = name.trim();
    this.exactName = name;
    this.parentID = parentID;
  }
}
