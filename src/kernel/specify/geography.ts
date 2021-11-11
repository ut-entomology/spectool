import type { Knex } from 'knex';

import { SpecGeography, SpecGeographyTreeDefItem } from '../../shared/schema';
import { GeoDictionary } from '../../shared/specify_data';

enum GeoRank {
  Earth,
  Continent,
  Country,
  State,
  County
}

interface GeoRecord {
  rank: GeoRank;
  name: string;
  parentID: number;
}

export class Geography {
  private ranks: { [id: number]: GeoRank } = {};
  private records: { [id: number]: GeoRecord } = {};

  async load(db: Knex): Promise<void> {
    // Clear first so garbage collection can work during query.
    this.ranks = {};
    this.records = {};

    // Load assignments of rank IDs to geographic categories.
    const rankRows = await db
      .select<SpecGeographyTreeDefItem[]>('rankID, name')
      .from('geographytreedefitem');
    for (const row of rankRows) {
      const geoRank = GeoRank[row.name as keyof typeof GeoRank];
      if (geoRank !== undefined) {
        this.ranks[row.rankID] = geoRank;
      }
    }

    // Load all geographic entities.
    const geoRows = await db
      .select<SpecGeography[]>('geographyID, rankID, name, parentID')
      .from('geography');
    for (const row of geoRows) {
      const record = {
        rank: this.ranks[row.rankID],
        name: row.name,
        parentID: row.parentID
      };
      this.records[row.geographyID] = record;
    }
  }

  getCountries(): GeoDictionary {
    const countries: GeoDictionary = {};
    for (const entry of Object.entries(this.records)) {
      const record = entry[1];
      if (record.rank == GeoRank.Country) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        countries[entry[0]] = {
          id: entry[0],
          name: record.name
        };
      }
    }
    return countries;
  }

  getStates(countryID: number): GeoDictionary {
    const states: GeoDictionary = {};
    for (const entry of Object.entries(this.records)) {
      const record = entry[1];
      if (record.parentID == countryID) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        states[entry[0]] = {
          id: entry[0],
          name: record.name
        };
      }
    }
    return states;
  }
}
