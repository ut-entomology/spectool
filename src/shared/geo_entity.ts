export enum GeoRank {
  Earth,
  Continent,
  Country,
  State,
  County
}

export class GeoEntity {
  id: number;
  rank: GeoRank;
  name: string;
  parentID: number;

  constructor(id: number, rank: GeoRank, name: string, parentID: number) {
    this.id = id;
    this.rank = rank;
    this.name = name;
    this.parentID = parentID;
  }
}
