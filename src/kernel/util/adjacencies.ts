import * as path from 'path';

import { BinaryCountyAdjacencyFile } from './county_adjacency';
import { Geography } from '../specify/geography';
import { SPECIFY_USA } from '../../shared/specify_data';
import { Region, RegionRank } from '../../shared/region';
import { US_STATE_ABBREVS, toStateNameFromAbbrev } from './states';
import { stateAdjacencies } from './adjacency_data';

const BINARY_COUNTY_ADJACENCIES_FILE = path.join(
  __dirname,
  '../../../public/county-adjacencies.bin'
);

type AdjacenctRegionsByID = Record<number, Region[]>;

export class Adjacencies {
  private _adjacenciesByID: AdjacenctRegionsByID = {};
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
    const adjacentUSACountiesByID = await this._getAdjacentUSACounties();
    const adjacentNorthAmericanStates = this._getAdjacentNorthAmericanStates();

    Object.assign(
      this._adjacenciesByID,
      adjacentUSACountiesByID,
      adjacentNorthAmericanStates
    );
  }

  private _getAdjacentNorthAmericanStates(): AdjacenctRegionsByID {
    const usaStates = this._geography.getChildren(this._nameToID[SPECIFY_USA]);
    const canadaStates = this._geography.getChildren(this._nameToID['Canada']);
    const mexicoStates = this._geography.getChildren(this._nameToID['Mexico']);

    function toStateID(stateAbbrev: string): number {
      let stateName = toStateNameFromAbbrev(stateAbbrev);
      if (stateName === null) {
        throw Error(`State not found for adjacency abbreviation '${stateAbbrev}'`);
      }
      // All names in Specify have been latinized.
      stateName = Geography.latinize(stateName);
      let foundIDs = Geography.addIDs({}, usaStates, [stateName], false);
      if (!foundIDs[stateName]) {
        foundIDs = Geography.addIDs({}, canadaStates, [stateName], false);
        if (!foundIDs[stateName]) {
          foundIDs = Geography.addIDs({}, mexicoStates, [stateName], false);
        }
      }
      if (!foundIDs[stateName]) {
        throw Error(`ID not found for state '${stateName}'`);
      }
      return foundIDs[stateName];
    }

    const adjacentRegionsByID: AdjacenctRegionsByID = {};
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

  private async _getAdjacentUSACounties(): Promise<AdjacenctRegionsByID> {
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

    const adjacentRegionsByID: AdjacenctRegionsByID = {};
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
          adjacentRegions.push(fileIDToRegionMap[fileAdjacentCountyID]);
        }
      }
    }
    return adjacentRegionsByID;
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
