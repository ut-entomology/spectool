import type { Knex } from 'knex';

import { SpecGeography, SpecGeographyTreeDefItem } from '../../shared/schema';
import { GeoDictionary } from '../../shared/specify_data';
import { RegionRank, Region } from '../../shared/region';

export class Geography {
  private _ranks: Record<number, RegionRank> = {};
  private _regions: Record<number, Region> = {};

  async load(db: Knex): Promise<void> {
    // Clear first so garbage collection can work during query.
    this._ranks = {};
    this._regions = {};

    // Load assignments of rank IDs to geographic categories.
    const rankRows = await db
      .select<SpecGeographyTreeDefItem[]>('rankID', 'name')
      .from('geographytreedefitem');
    for (const row of rankRows) {
      const regionRank = RegionRank[row.name as keyof typeof RegionRank];
      if (regionRank !== undefined) {
        this._ranks[row.rankID] = regionRank;
      }
    }

    // Load all geographic regions.
    const geoRows = await db
      .select<SpecGeography[]>('geographyID', 'rankID', 'name', 'parentID')
      .from('geography');
    for (const row of geoRows) {
      this._regions[row.geographyID] = new Region(
        row.geographyID,
        this._ranks[row.rankID],
        row.name,
        row.parentID
      );
    }
  }

  getCountries(): GeoDictionary {
    this._assertLoaded();
    const countries: GeoDictionary = {};
    for (const [id, region] of Object.entries(this._regions)) {
      if (region.rank == RegionRank.Country) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        countries[id] = {
          id,
          name: region.name
        };
      }
    }
    return countries;
  }

  getCountriesOf(geoIDs: number[]): Region[] {
    this._assertLoaded();
    const countries: Region[] = [];
    const countriesFound: Record<number, boolean> = {};
    for (const geoID of geoIDs) {
      const country = this.getRegionByRank(RegionRank.Country, geoID);
      if (country && countriesFound[country.id] === undefined) {
        countries.push(country);
        countriesFound[country.id] = true;
      }
    }
    return countries.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  getRegionByRank(rank: RegionRank, forID: number): Region | null {
    let region = this._regions[forID];
    while (region.rank !== rank) {
      if (region.parentID === null) {
        return null;
      }
      region = this._regions[region.parentID];
    }
    return region;
  }

  getContainedGeographyIDs(underGeoID: number): number[] {
    const geoIDs: number[] = [];
    for (let region of Object.values(this._regions)) {
      const descendantGeoIDs: number[] = [];
      while (region.id !== null) {
        if (region.id === underGeoID) {
          geoIDs.push(...descendantGeoIDs);
          break;
        } else {
          descendantGeoIDs.push(region.id);
        }
        region = this._regions[region.parentID];
      }
    }
    return geoIDs;
  }

  getStates(countryID: number): GeoDictionary {
    this._assertLoaded();
    const states: GeoDictionary = {};
    for (const [id, region] of Object.entries(this._regions)) {
      if (region.parentID == countryID) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        states[id] = {
          id,
          name: region.name
        };
      }
    }
    return states;
  }

  getStatesOf(countryID: number, geoIDs: number[]): Region[] {
    this._assertLoaded();
    const states: Region[] = [];
    const statesFound: Record<number, boolean> = {};
    for (const geoID of geoIDs) {
      const state = this.getRegionByRank(RegionRank.State, geoID);
      if (state && statesFound[state.id] === undefined) {
        const country = this.getRegionByRank(RegionRank.Country, state.id);
        if (country && country.id == countryID) {
          states.push(state);
          statesFound[state.id] = true;
        }
      }
    }
    return states.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  toNameMap(countryID: number): Record<string, Region[]> {
    const nameMap: Record<string, Region[]> = {};
    for (const regionID of this.getContainedGeographyIDs(countryID)) {
      const region = this._regions[regionID];
      let mappedRegions = nameMap[region.name];
      if (mappedRegions === undefined) {
        nameMap[region.name] = [region];
      } else {
        mappedRegions.push(region);
      }
    }
    return nameMap;
  }

  private _assertLoaded() {
    if (!this._regions) {
      throw Error('No geographic regions loaded');
    }
  }
}
