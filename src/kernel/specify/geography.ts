import type { GeoDictionary } from '../../shared/specify_data';
import { RegionRank, Region } from '../../shared/region';
import * as query from './queries';

// Note: Specify stores the latinizations of locality names
// with accents and diacritics removed.

export class Geography {
  private _ranksByID: Record<number, RegionRank> = {};
  private _regionsByID: Record<number, Region> = {};

  /**
   * Adds to the provided name map the geography IDs from the given dictionary
   * for the given names, and returns the modified name map.
   */

  static addIDs(
    toNameMap: Record<string, number>,
    dictionary: GeoDictionary,
    names: string[],
    overrideDuplicates = false
  ) {
    let remainingNames = names.slice();
    for (const entry of Object.values(dictionary)) {
      const nameIndex = names.indexOf(entry.name);
      if (nameIndex >= 0) {
        // The state of Pennsylvania occurs twice in Specify; use the first one.
        if (overrideDuplicates || !toNameMap[names[nameIndex]]) {
          toNameMap[names[nameIndex]] = entry.id;
          remainingNames.splice(remainingNames.indexOf(entry.name), 1);
        }
      }
    }
    if (remainingNames.length > 0) {
      throw Error(`Could not find IDs for ${remainingNames}`);
    }
    return toNameMap;
  }

  static latinize(name: string): string {
    // All geography names in Specify have been latinized (accents and diacritics removed)
    // from https://stackoverflow.com/a/51874461/650894
    return name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  async load(db: query.DB): Promise<void> {
    // Clear first so garbage collection can work during query.
    this._ranksByID = {};
    this._regionsByID = {};

    // Load assignments of rank IDs to geographic categories.
    const rankRows = await query.getGeographyRanks(db);
    for (const row of rankRows) {
      const regionRank = RegionRank[row.Name as keyof typeof RegionRank];
      if (regionRank !== undefined) {
        this._ranksByID[row.RankID] = regionRank;
      }
    }

    // Load all geographic regions.
    const geoRows = await query.getAllGeographicRegions(db);
    for (const row of geoRows) {
      this._regionsByID[row.GeographyID] = new Region(
        row.GeographyID,
        this._ranksByID[row.RankID],
        row.Name,
        row.ParentID
      );
    }
  }

  getChildren(parentID: number): GeoDictionary {
    if (!parentID) {
      throw Error(`Invalid parentID: ${parentID}`);
    }
    this._assertLoaded();
    const children: GeoDictionary = {};
    for (const region of Object.values(this._regionsByID)) {
      if (region.parentID === parentID) {
        // @ts-ignore because equivalent string and number indexes are equivalent
        children[region.id] = {
          id: region.id,
          name: region.name
        };
      }
    }
    return children;
  }

  getCountries(): GeoDictionary {
    this._assertLoaded();
    const countries: GeoDictionary = {};
    for (const region of Object.values(this._regionsByID)) {
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
    const region = this._regionsByID[regionID];
    return region != undefined ? region : null;
  }

  getRegionByRank(rank: RegionRank, forID: number): Region | null {
    let region = this._regionsByID[forID];
    while (region.rank !== rank) {
      if (region.parentID === null) {
        return null;
      }
      region = this._regionsByID[region.parentID];
    }
    return region;
  }

  getContainedRegions(underGeoID: number): Region[] {
    // potentially many regions, so use a hash to track them
    const foundIDs: Record<number, boolean> = {};
    const regions: Region[] = [];
    for (let region of Object.values(this._regionsByID)) {
      const descendantRegions: Region[] = [];
      while (region) {
        if (region.id === underGeoID || foundIDs[region.id]) {
          for (const descendantRegion of descendantRegions) {
            regions.push(descendantRegion);
            foundIDs[descendantRegion.id] = true;
          }
          break;
        } else {
          descendantRegions.push(region);
        }
        region = this._regionsByID[region.parentID];
      }
    }
    return regions;
  }

  getContainingRegions(aboveGeoID: number): Region[] {
    const regions: Region[] = [];
    let region = this._regionsByID[aboveGeoID];
    while (region.parentID !== null) {
      region = this._regionsByID[region.parentID];
      regions.push(region);
    }
    return regions;
  }

  getNameToRegionMap(underID: number): Record<string, Region[]> {
    const nameToRegionMap: Record<string, Region[]> = {};
    for (const region of this.getContainedRegions(underID)) {
      let mappedRegions = nameToRegionMap[region.name];
      if (mappedRegions === undefined) {
        nameToRegionMap[region.name] = [region];
      } else {
        mappedRegions.push(region);
      }
    }
    return nameToRegionMap;
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
    if (!this._regionsByID) {
      throw Error('No geographic regions loaded');
    }
  }
}
