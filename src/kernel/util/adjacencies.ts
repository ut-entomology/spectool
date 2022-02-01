import * as path from 'path';

import { BinaryCountyAdjacencyFile } from './county_adjacency';
import { Geography } from '../specify/geography';
import {
  GeoDictionary,
  Region,
  RegionRank,
  SPECIFY_USA
} from '../../shared/shared_geography';
import { US_STATE_ABBREVS, toStateNameFromAbbrev } from './states';
import { countryAdjacencies, stateAdjacencies, usaAdjacencies } from './adjacency_data';

const BINARY_COUNTY_ADJACENCIES_FILE = path.join(
  __dirname,
  '../../../public/data/county-adjacencies.bin'
);

type adjacentRegionsByID = Record<number, Region[]>;

export class Adjacencies {
  private _adjacenciesByID: adjacentRegionsByID = {};
  private _geography: Geography;
  private _nameToID: Record<string, number> = {};

  constructor(geography: Geography) {
    this._geography = geography;
    Geography.addIDs(this._nameToID, geography.getCountries(), [
      SPECIFY_USA,
      'Canada',
      'Mexico'
    ]);
  }

  forID(geographicID: number): Region[] {
    const adjacencies = this._adjacenciesByID[geographicID];
    return adjacencies === undefined ? [] : adjacencies;
  }

  async load(): Promise<void> {
    const usaStates = this._geography.getChildren(this._nameToID[SPECIFY_USA]);
    const canadaStates = this._geography.getChildren(this._nameToID['Canada']);
    const mexicoStates = this._geography.getChildren(this._nameToID['Mexico']);
    const naStates = Object.assign({}, usaStates, canadaStates, mexicoStates);

    const adjacentUSACountiesByID = await this._getAdjacentUSACounties();
    const adjacentNAStates = this._getAdjacentNorthAmericanStates(naStates);
    const adjacentNACountries = this._getAdjacentNorthAmericanCountries();

    Object.assign(
      this._adjacenciesByID,
      adjacentUSACountiesByID,
      adjacentNAStates,
      adjacentNACountries
    );

    this._addStatesAdjacentToUSACounties(naStates);
    this._addAdjacenciesToParentStateAndCountry();
    this._addReciprocateAdjacencies();
  }

  private _getAdjacentNorthAmericanCountries(): adjacentRegionsByID {
    const countries = this._geography.getCountries();

    function toCountryID(countryName: string): number {
      const foundIDs = Geography.addIDs({}, countries, [countryName]);
      return foundIDs[countryName];
    }

    const adjacentRegionsByID: adjacentRegionsByID = {};
    for (const [countryName, adjacentCountryNames] of Object.entries(
      countryAdjacencies
    )) {
      const countryID = toCountryID(countryName);
      const adjacentRegions: Region[] = [];
      for (const adjacentCountryName of adjacentCountryNames) {
        const adjacentCountryID = toCountryID(adjacentCountryName);
        const adjacentRegion = this._geography.getRegionByID(adjacentCountryID);
        if (adjacentRegion === null) {
          throw Error(`Could not find region for country ID ${adjacentCountryID}`);
        }
        adjacentRegions.push(adjacentRegion);
      }
      adjacentRegionsByID[countryID] = adjacentRegions;
    }
    return adjacentRegionsByID;
  }

  private _getAdjacentNorthAmericanStates(
    naStates: GeoDictionary
  ): adjacentRegionsByID {
    function toStateID(stateAbbrev: string): number {
      let stateName = toStateNameFromAbbrev(stateAbbrev);
      if (stateName === null) {
        throw Error(`State not found for adjacency abbreviation '${stateAbbrev}'`);
      }
      // All names in Specify have been latinized.
      stateName = Geography.latinize(stateName);
      const foundIDs = Geography.addIDs({}, naStates, [stateName]);
      return foundIDs[stateName];
    }

    const adjacentRegionsByID: adjacentRegionsByID = {};
    for (const [stateAbbrev, adjacentStateAbbrevs] of Object.entries(
      stateAdjacencies
    )) {
      const stateID = toStateID(stateAbbrev);
      const adjacentRegions: Region[] = [];
      for (const adjacentStateAbbrev of adjacentStateAbbrevs) {
        const adjacentStateID = toStateID(adjacentStateAbbrev);
        const adjacentRegion = this._geography.getRegionByID(adjacentStateID);
        if (adjacentRegion === null) {
          throw Error(`Could not find region for state ID ${adjacentStateID}`);
        }
        adjacentRegions.push(adjacentRegion);
      }
      adjacentRegionsByID[stateID] = adjacentRegions;
    }
    return adjacentRegionsByID;
  }

  private async _getAdjacentUSACounties(): Promise<adjacentRegionsByID> {
    // Load the binary county adjacency file.

    const fileCountyAdjacencyFile = new BinaryCountyAdjacencyFile(
      BINARY_COUNTY_ADJACENCIES_FILE
    );
    const fileCountyAdjacencies = await fileCountyAdjacencyFile.read();

    // Create a map of file county IDs to Specify geography entries (regions).

    const fileIDToRegionMap: Record<number, Region> = {};
    const nameToRegionMap = this._geography.getNameToRegionMap(
      this._nameToID[SPECIFY_USA]
    );

    for (const fileCountyAdjacency of fileCountyAdjacencies) {
      const adjacencyStateName = US_STATE_ABBREVS[fileCountyAdjacency.stateAbbr];
      let regionsForCountyName = getRegionsForCountyName(
        nameToRegionMap,
        fileCountyAdjacency.countyName
      );
      // Some counties can't be mapped, particularly in Alaska.
      if (regionsForCountyName) {
        for (const regionForCountyName of regionsForCountyName) {
          const foundRegionState = this._geography.getRegionByRank(
            RegionRank.State,
            regionForCountyName.id
          );
          if (foundRegionState!.name == adjacencyStateName) {
            fileIDToRegionMap[fileCountyAdjacency.countyID] = regionForCountyName;
          }
        }
      }
    }

    // Store away the county adjacencies as regions.

    const adjacentRegionsByID: adjacentRegionsByID = {};
    for (const fileCountyAdjacency of fileCountyAdjacencies) {
      const countyRegion = fileIDToRegionMap[fileCountyAdjacency.countyID];
      if (countyRegion) {
        // not all counties were able to be mapped
        let adjacentRegions = adjacentRegionsByID[countyRegion.id];
        if (adjacentRegions === undefined) {
          adjacentRegions = [];
          adjacentRegionsByID[countyRegion.id] = adjacentRegions;
        }
        for (const fileAdjacentCountyID of fileCountyAdjacency.adjacentIDs) {
          // Some counties could not be mapped and so don't exist.
          const fileAdjacentCountyRegion = fileIDToRegionMap[fileAdjacentCountyID];
          if (fileAdjacentCountyRegion) {
            adjacentRegions.push(fileAdjacentCountyRegion);
          }
        }
      }
    }
    return adjacentRegionsByID;
  }

  private _addStatesAdjacentToUSACounties(naStates: GeoDictionary) {
    function toStateID(stateName: string): number {
      stateName = Geography.latinize(stateName);
      const foundIDs = Geography.addIDs({}, naStates, [stateName]);
      return foundIDs[stateName];
    }

    for (const [stateAbbrev, stateAdjacencies] of Object.entries(usaAdjacencies)) {
      const latinStateAdjacencies: Record<string, string[]> = {};
      for (const [countyName, adjacentStateNames] of Object.entries(stateAdjacencies)) {
        const latinStateNames: string[] = [];
        for (const stateName of adjacentStateNames) {
          latinStateNames.push(Geography.latinize(stateName));
        }
        latinStateAdjacencies[Geography.latinize(countyName)] = latinStateNames;
      }

      const stateName = toStateNameFromAbbrev(stateAbbrev);
      if (!stateName) {
        throw Error(`State not found for abbreviation '${stateAbbrev}'`);
      }
      const stateID = toStateID(Geography.latinize(stateName));
      const stateCounties = this._geography.getChildren(stateID);
      const borderCountyIDs = Geography.addIDs(
        {},
        stateCounties,
        Object.keys(latinStateAdjacencies)
      );
      for (const [countyName, adjacentStateNames] of Object.entries(
        latinStateAdjacencies
      )) {
        const borderCountyID = borderCountyIDs[countyName];
        const countyAdjacencies = this._adjacenciesByID[borderCountyID];
        const adjacentStateIDMap = Geography.addIDs({}, naStates, adjacentStateNames);
        for (const [adjacentStateName, adjacentStateID] of Object.entries(
          adjacentStateIDMap
        )) {
          const adjacentStateRegion = this._geography.getRegionByID(adjacentStateID);
          if (!adjacentStateRegion) {
            throw Error(`Region not found for adjacent state '${adjacentStateName}'`);
          }
          countyAdjacencies.push(adjacentStateRegion);
        }
      }
    }
  }

  private _addAdjacenciesToParentStateAndCountry() {
    const self = this;

    function getParentIDs(ofRegion: Region): number[] {
      const parentIDs: number[] = [];
      if (ofRegion.rank == RegionRank.County) {
        parentIDs.push(ofRegion.parentID);
        ofRegion = self._geography.getRegionByID(ofRegion.parentID)!;
      }
      if (ofRegion.rank == RegionRank.State) {
        parentIDs.push(ofRegion.parentID);
      }
      return parentIDs;
    }

    for (const [regionID, adjacentRegions] of Object.entries(this._adjacenciesByID)) {
      const region = this._geography.getRegionByID(parseInt(regionID))!;
      const nonAdjacentParentIDs = getParentIDs(region);
      const regionsToAdd: Record<number, Region> = {};
      for (const adjacentRegion of adjacentRegions) {
        for (const adjacentRegionParentID of getParentIDs(adjacentRegion)) {
          if (!nonAdjacentParentIDs.includes(adjacentRegionParentID)) {
            const parentRegion = self._geography.getRegionByID(adjacentRegionParentID)!;
            regionsToAdd[parentRegion.id] = parentRegion; // prevent duplicates
          }
        }
      }
      for (const regionToAdd of Object.values(regionsToAdd)) {
        adjacentRegions.push(regionToAdd);
      }
    }
  }

  private _addReciprocateAdjacencies() {
    for (const [regionID, adjacentRegions] of Object.entries(this._adjacenciesByID)) {
      const region = this._geography.getRegionByID(parseInt(regionID))!;
      for (const adjacentRegion of adjacentRegions) {
        const adjacentRegionAdjacentRegions = this._adjacenciesByID[adjacentRegion.id];
        if (!adjacentRegionAdjacentRegions.includes(region)) {
          adjacentRegionAdjacentRegions.push(region);
        }
      }
    }
  }
}

function getRegionsForCountyName(
  nameToRegionMap: Record<string, Region[]>,
  censusCountyName: string
): Region[] | null {
  let countyName = Geography.latinize(censusCountyName);
  let regions = nameToRegionMap[countyName];
  if (!regions) {
    if (countyName == 'Bronx County') {
      countyName = 'Bronx';
    } else if (countyName.toLowerCase().endsWith(' city')) {
      countyName = 'City of ' + countyName.substring(0, countyName.length - 5);
    } else if (countyName.endsWith('Census Area') || countyName.endsWith('Borough')) {
      // There are several irreconcilable problems with these.
      return null;
    }
    countyName = countyName.replace('St.', 'Saint').replace('Ste.', 'Sainte');
    regions = nameToRegionMap[countyName];
    if (regions === undefined) {
      throw Error(
        `No region found for county '${censusCountyName}' (tried ${countyName})`
      );
    }
  }
  return regions;
}

// function toTitleCase(str: string) {
//   // from https://stackoverflow.com/a/196991/650894
//   return str.replace(/\w\S*/g, function (txt) {
//     return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
//   });
// }
