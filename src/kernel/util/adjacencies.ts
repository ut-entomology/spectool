import { BinaryCountyAdjacencyFile } from './county_adjacency';
import { Geography } from '../specify/geography';
import { Region, RegionRank } from '../../shared/region';
import { US_STATE_ABBREVS } from './states';

const REGION_UNITED_STATES = 'United States';

export class Adjacencies {
  private _adjacenciesByID: Record<number, Region[]> = {};
  private _geography: Geography;
  private _binaryCountyAdjacencyFile: string;
  private _usaRegionID: number;

  constructor(geography: Geography, binaryCountyAdjacencyFile: string) {
    this._geography = geography;
    this._binaryCountyAdjacencyFile = binaryCountyAdjacencyFile;

    let usaRegionID: number;
    for (const [countryID, country] of Object.entries(geography.getCountries())) {
      if (country.name == REGION_UNITED_STATES) {
        usaRegionID = parseInt(countryID);
        break;
      }
    }
    if (usaRegionID! === undefined) {
      throw Error("Region for 'United States' not found");
    }
    this._usaRegionID = usaRegionID;
  }

  forID(geographicID: number): Region[] {
    const adjacencies = this._adjacenciesByID[geographicID];
    return adjacencies === undefined ? [] : adjacencies;
  }

  async load(): Promise<void> {
    await this._loadUSCountyAdjacencies();
  }

  private async _loadUSCountyAdjacencies(): Promise<void> {
    const countyAdjacencyFile = new BinaryCountyAdjacencyFile(
      this._binaryCountyAdjacencyFile
    );
    const countyAdjacencies = await countyAdjacencyFile.read();

    // Create a map of file county IDs to Specify geography entries (regions).

    const fileIDToRegionMap: Record<number, Region> = {};
    const regionNameMap = this._geography.toNameMap(this._usaRegionID);

    for (const countyAdjacency of countyAdjacencies) {
      const adjacencyState = US_STATE_ABBREVS[countyAdjacency.stateAbbr];
      const regionsOfThisName = regionNameMap[countyAdjacency.countyName];
      if (regionsOfThisName === undefined) {
        throw Error(`No region found for county '${countyAdjacency.countyName}'`);
      }
      for (const regionOfThisName of regionsOfThisName) {
        const regionState = this._geography.getRegionByRank(
          RegionRank.State,
          regionOfThisName.id
        )!.name;
        if (regionState == adjacencyState) {
          fileIDToRegionMap[countyAdjacency.countyID] = regionOfThisName;
        }
      }
    }

    // Store away the county adjacencies as regions.

    for (const countyAdjacency of countyAdjacencies) {
      let adjacentRegions = this._adjacenciesByID[countyAdjacency.countyID];
      if (adjacentRegions === undefined) {
        adjacentRegions = [];
        this._adjacenciesByID[countyAdjacency.countyID] = adjacentRegions;
      }
      for (const adjacentCountyID of countyAdjacency.adjacentIDs) {
        adjacentRegions.push(fileIDToRegionMap[adjacentCountyID]);
      }
    }
  }
}
