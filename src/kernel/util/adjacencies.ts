import { BinaryCountyAdjacencyFile } from './county_adjacency';
import { Geography } from '../specify/geography';
import { SPECIFY_USA } from '../../shared/specify_data';
import { Region, RegionRank } from '../../shared/region';
import { US_STATE_ABBREVS, toStateNameFromAbbrev } from './states';
import { stateAdjacencies } from './adjacency_data';

type AdjacenctRegionsByID = Record<number, Region[]>;

export class Adjacencies {
  private _adjacenciesByID: AdjacenctRegionsByID = {};
  private _geography: Geography;
  private _binaryCountyAdjacencyFile: string;
  private _usaRegionID: number;
  private _canadaRegionID: number;
  private _mexicoRegionID: number;

  constructor(geography: Geography, binaryCountyAdjacencyFile: string) {
    this._geography = geography;
    this._binaryCountyAdjacencyFile = binaryCountyAdjacencyFile;
    const countryIDs = Geography.findIDs(geography.getCountries(), [
      SPECIFY_USA,
      'Canada',
      'Mexico'
    ]);
    this._usaRegionID = countryIDs[0];
    this._canadaRegionID = countryIDs[1];
    this._mexicoRegionID = countryIDs[2];
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
    const usaStates = this._geography.getStates(this._usaRegionID);
    const canadaStates = this._geography.getStates(this._canadaRegionID);
    const mexicoStates = this._geography.getStates(this._mexicoRegionID);

    function toStateID(stateAbbrev: string): number {
      const stateName = toStateNameFromAbbrev(stateAbbrev);
      if (stateName === null) {
        throw Error(`State not found for adjacency abbreviation '${stateAbbrev}'`);
      }
      let foundIDs = Geography.findIDs(usaStates, [stateName]);
      if (foundIDs.length === 0) {
        foundIDs = Geography.findIDs(canadaStates, [stateName]);
        if (foundIDs.length === 0) {
          foundIDs = Geography.findIDs(mexicoStates, [stateName]);
        }
      }
      if (foundIDs.length === 0) {
        throw Error(`ID not found for state '${stateName}'`);
      }
      if (foundIDs.length > 0) {
        throw Error(`Found more than one state named '${stateName}'`);
      }
      return foundIDs[0];
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
      this._binaryCountyAdjacencyFile
    );
    const fileCountyAdjacencies = await fileCountyAdjacencyFile.read();

    // Create a map of file county IDs to Specify geography entries (regions).

    const fileIDToRegionMap: Record<number, Region> = {};
    const nameToRegionMap = this._geography.getNameToRegionMap(this._usaRegionID);

    for (const fileCountyAdjacency of fileCountyAdjacencies) {
      const adjacencyStateName = US_STATE_ABBREVS[fileCountyAdjacency.stateAbbr];
      const regionsForCountyName = nameToRegionMap[fileCountyAdjacency.countyName];
      if (regionsForCountyName === undefined) {
        throw Error(`No region found for county '${fileCountyAdjacency.countyName}'`);
      }
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

    // Store away the county adjacencies as regions.

    const adjacentRegionsByID: AdjacenctRegionsByID = {};
    for (const fileCountyAdjacency of fileCountyAdjacencies) {
      const countyRegionID = fileIDToRegionMap[fileCountyAdjacency.countyID].id;
      let adjacentRegions = adjacentRegionsByID[countyRegionID];
      if (adjacentRegions === undefined) {
        adjacentRegions = [];
        adjacentRegionsByID[countyRegionID] = adjacentRegions;
      }
      for (const fileAdjacentCountyID of fileCountyAdjacency.adjacentIDs) {
        adjacentRegions.push(fileIDToRegionMap[fileAdjacentCountyID]);
      }
    }
    return adjacentRegionsByID;
  }
}
