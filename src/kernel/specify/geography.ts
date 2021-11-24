import type { Knex } from 'knex';

import { SpecGeography, SpecGeographyTreeDefItem } from '../../shared/schema';
import { GeoDictionary } from '../../shared/specify_data';
import { GeoRank, GeoEntity } from '../../shared/geo_entity';

export class Geography {
  private ranks: Record<number, GeoRank> = {};
  private entities: Record<number, GeoEntity> = {};

  async load(db: Knex): Promise<void> {
    // Clear first so garbage collection can work during query.
    this.ranks = {};
    this.entities = {};

    // Load assignments of rank IDs to geographic categories.
    const rankRows = await db
      .select<SpecGeographyTreeDefItem[]>('rankID', 'name')
      .from('geographytreedefitem');
    for (const row of rankRows) {
      const geoRank = GeoRank[row.name as keyof typeof GeoRank];
      if (geoRank !== undefined) {
        this.ranks[row.rankID] = geoRank;
      }
    }

    // Load all geographic entities.
    const geoRows = await db
      .select<SpecGeography[]>('geographyID', 'rankID', 'name', 'parentID')
      .from('geography');
    for (const row of geoRows) {
      this.entities[row.geographyID] = new GeoEntity(
        row.geographyID,
        this.ranks[row.rankID],
        row.name,
        row.parentID
      );
    }
  }

  getCountries(): GeoDictionary {
    this._assertLoaded();
    const countries: GeoDictionary = {};
    for (const entry of Object.entries(this.entities)) {
      const entity = entry[1];
      if (entity.rank == GeoRank.Country) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        countries[entry[0]] = {
          id: entry[0],
          name: entity.name
        };
      }
    }
    return countries;
  }

  getCountriesOf(geoIDs: number[]): GeoEntity[] {
    this._assertLoaded();
    const countries: GeoEntity[] = [];
    const countriesFound: Record<number, boolean> = {};
    for (const geoID of geoIDs) {
      const country = this.getEntityByRank(GeoRank.Country, geoID);
      if (country && countriesFound[country.id] === undefined) {
        countries.push(country);
        countriesFound[country.id] = true;
      }
    }
    return countries.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  getEntityByRank(rank: GeoRank, forID: number): GeoEntity | null {
    let entity = this.entities[forID];
    while (entity.rank !== rank) {
      if (entity.parentID === null) {
        return null;
      }
      entity = this.entities[entity.parentID];
    }
    return entity;
  }

  getStates(countryID: number): GeoDictionary {
    this._assertLoaded();
    const states: GeoDictionary = {};
    for (const entry of Object.entries(this.entities)) {
      const entity = entry[1];
      if (entity.parentID == countryID) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        states[entry[0]] = {
          id: entry[0],
          name: entity.name
        };
      }
    }
    return states;
  }

  getStatesOf(countryID: number, geoIDs: number[]): GeoEntity[] {
    this._assertLoaded();
    const states: GeoEntity[] = [];
    const statesFound: Record<number, boolean> = {};
    for (const geoID of geoIDs) {
      const state = this.getEntityByRank(GeoRank.State, geoID);
      if (state && statesFound[state.id] === undefined) {
        const country = this.getEntityByRank(GeoRank.Country, state.id);
        if (country && country.id == countryID) {
          states.push(state);
          statesFound[state.id] = true;
        }
      }
    }
    return states.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  private _assertLoaded() {
    if (!this.entities) {
      throw Error('No geographic entities loaded');
    }
  }
}
