import type { Knex } from 'knex';

import { SpecGeography, SpecGeographyTreeDefItem } from '../../shared/schema';
import { GeoDictionary } from '../../shared/specify_data';
import { RegionRank, Region } from '../../shared/region';

// Note: Specify stores the latinizations of locality names
// with accents and diacritics removed.

export class Geography {
  private _ranks: Record<number, RegionRank> = {};
  private _regions: Record<number, Region> = {};

  /**
   * Adds to the provided name map the geography IDs from the given dictionary
   * for the given names, and returns the modified name map.
   */

  static addIDs(
    toNameMap: Record<string, number>,
    dictionary: GeoDictionary,
    names: string[],
    errorIfNotFound = true
  ) {
    let remainingNames = names.slice();
    for (const entry of Object.values(dictionary)) {
      const nameIndex = names.indexOf(entry.name);
      if (nameIndex >= 0) {
        toNameMap[names[nameIndex]] = entry.id;
        remainingNames.splice(remainingNames.indexOf(entry.name), 1);
      }
    }
    if (errorIfNotFound && remainingNames.length > 0) {
      throw Error(`Could not find IDs for ${remainingNames}`);
    }
    return toNameMap;
  }

  static latinize(name: string): string {
    // All geography names in Specify have been latinized (accents and diacritics removed)
    // from https://stackoverflow.com/a/51874461/650894
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

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
    for (const region of Object.values(this._regions)) {
      if (region.rank === RegionRank.Country) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        countries[region.id] = {
          id: region.id,
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

  getRegionByID(regionID: number): Region | null {
    const region = this._regions[regionID];
    return region != undefined ? region : null;
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
    // potentially many IDs, so use a hash to track them
    const foundIDs: Record<number, boolean> = {};
    // but don't waste time calling parseInt on the hash keys
    const geoIDs: number[] = [];
    for (let region of Object.values(this._regions)) {
      const descendantGeoIDs: number[] = [];
      while (region) {
        if (region.id === underGeoID || foundIDs[region.id]) {
          for (const geoID of descendantGeoIDs) {
            geoIDs.push(geoID);
            foundIDs[geoID] = true;
          }
          break;
        } else {
          descendantGeoIDs.push(region.id);
        }
        region = this._regions[region.parentID];
      }
    }
    return geoIDs;
  }

  getNameToRegionMap(underID: number): Record<string, Region[]> {
    const nameToRegionMap: Record<string, Region[]> = {};
    for (const regionID of this.getContainedGeographyIDs(underID)) {
      const region = this._regions[regionID];
      let mappedRegions = nameToRegionMap[region.name];
      if (mappedRegions === undefined) {
        nameToRegionMap[region.name] = [region];
      } else {
        mappedRegions.push(region);
      }
    }
    return nameToRegionMap;
  }

  getStates(countryID: number): GeoDictionary {
    this._assertLoaded();
    const states: GeoDictionary = {};
    for (const region of Object.values(this._regions)) {
      if (region.parentID === countryID) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        states[region.id] = {
          id: region.id,
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
        if (country && country.id === countryID) {
          states.push(state);
          statesFound[state.id] = true;
        }
      }
    }
    return states.sort((a, b) => (a.name < b.name ? -1 : 1));
  }

  private _assertLoaded() {
    if (!this._regions) {
      throw Error('No geographic regions loaded');
    }
  }
}
