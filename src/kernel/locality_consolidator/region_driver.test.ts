import * as path from 'path';
import * as fs from 'fs';

import { AdjoiningRegions } from './adjoining_regions';
import { AdjoiningRegionDriver, Diagnostics } from './region_driver';
import type { CachedLocality, LocalityCache } from './locality_cache';
import { Region, RegionRank } from '../../shared/region';
import { TrackedRegionRoster } from './region_roster';
import { TrackedRegion, TrackedRegionStatus } from './tracked_region';

const TEST_LOG_DIR = path.join(__dirname, '../../../test_logs');

// Explanation of region matrix string data:

// 'a' prefix means it's adjacent, not in the domain
// 'c-' prefix means county or municipality
// 's-' prefix means state
// 'y-' prefix means country
// Capital letter sequence designates a region
// dash-number indicates the number of localities in the region
// < indicates that the region to the left extends to this point
// ^ indicates that the region above extends to this point

describe('locality consolidator', () => {
  test('processes regions in correct order (no corner adjacency)', async () => {
    const scenario = new RegionScenario(
      `as-MA-1|<     |<     |as-MB-1
       c-CA-1 |c-CB-1|c-CC-1|c-CD-1 |as-NM-1
       c-CE-1 |c-CF-1|c-CG-1|c-CH-1 |^
       c-CI-1 |c-CJ-1|c-CK-1|c-CL-1 |as-LA-1`,
      false
    );

    const processedRegionIDs: number[] = [];
    const localityCache = new DummyLocalityCache(scenario);
    const diagnostics = new TestDiagnostics(
      scenario,
      localityCache,
      'region-driver-1.txt'
    );

    const regionDriver = new AdjoiningRegionDriver(
      scenario,
      scenario.getDomainRegions(),
      localityCache,
      (region) => {
        processedRegionIDs.push(region.id);
        localityCache.uncacheLocality(region.id);
      },
      diagnostics,
      scenario.codeToRegion('CB').id
    );
    await regionDriver.run();
    diagnostics.close();

    expect(processedRegionIDs.map((id) => scenario.regionsByID[id].code)).toEqual([
      'CB',
      'MA',
      'CA',
      'CE',
      'CI',
      'CF',
      'CC',
      'MX',
      'CJ',
      'CG',
      'CK',
      'US',
      'CH',
      'NM',
      'CD',
      'MB',
      'CL',
      'TX',
      'LA'
    ]);
  });
});

class RegionScenario implements AdjoiningRegions {
  private _withCornerAdjacency: boolean;
  private _regionMatrix: DummyRegion[][] = [];

  regionsByCode: Record<string, DummyRegion> = {};
  regionsByID: Record<number, DummyRegion> = {};

  constructor(regionData: string, withCornerAdjacency: boolean) {
    this._withCornerAdjacency = withCornerAdjacency;

    // Define regions not in the matrix.

    this._indexDummyRegion(
      new DummyRegion('US', false, 1, new Region(100, RegionRank.Country, 'US', 0))
    );
    this._indexDummyRegion(
      new DummyRegion('TX', true, 1, new Region(101, RegionRank.State, 'TX', 0))
    );
    this._indexDummyRegion(
      new DummyRegion('MX', false, 1, new Region(102, RegionRank.Country, 'MX', 0))
    );

    // Create a region for each cell of the matrix.

    const rows = regionData.split('\n');
    let rowIndex = 0;
    let nextID = 1;
    for (const row of rows) {
      if (row.trim() == '') {
        continue;
      }
      const regionRow: DummyRegion[] = [];
      let columnIndex = 0;
      const columns = row.split('|');
      for (const column of columns) {
        let code: string;
        let rank: RegionRank;
        let inDomain = true;
        let localityTotal: number;

        // Parse the cell.

        const units = column.trim().split('-');
        if (units[0] == '<') {
          regionRow.push(regionRow[columnIndex - 1]);
        } else if (units[0] == '^') {
          regionRow.push(this._regionMatrix[rowIndex - 1][columnIndex]);
        } else {
          if (units[0][0] == 'a') {
            inDomain = false;
            units[0] = units[0].substr(1);
          }
          switch (units[0][0]) {
            case 'c':
              rank = RegionRank.County;
              break;
            case 's':
              rank = RegionRank.State;
              break;
            case 'y':
              rank = RegionRank.Country;
              break;
            default:
              throw Error(`Unrecognized rank '${units[0][0]}' in column '${column}'`);
          }
          code = units[1];
          localityTotal = parseInt(units[2]);

          // Contruct a region for the cell.

          const region = new Region(nextID++, rank, code, 0);
          const dummyRegion = new DummyRegion(code, inDomain, localityTotal, region);
          regionRow.push(dummyRegion);
          this._indexDummyRegion(dummyRegion);

          // Assign the region's parent ID.

          if (code[0] == 'M') {
            region.parentID = this.regionsByCode['MX'].actualRegion.id;
          } else if (code[0] == 'C') {
            region.parentID = this.regionsByCode['TX'].actualRegion.id;
          } else {
            region.parentID = this.regionsByCode['US'].actualRegion.id;
          }
          this.regionsByCode['TX'].actualRegion.parentID =
            this.regionsByCode['US'].actualRegion.id;
        }
        columnIndex += 1;
      }
      rowIndex += 1;
      this._regionMatrix.push(regionRow);
    }
  }

  getAdjacentRegions(toGeographyID: number): Region[] {
    return this._getAdjacentRegions(toGeographyID).map((region) => region.actualRegion);
  }

  getContainingRegions(aboveGeographyID: number): Region[] {
    const region = this.regionsByID[aboveGeographyID];
    if (['US', 'MX'].includes(region.code)) {
      return [];
    }
    if (region.code[0] == 'M') {
      return [this.codeToRegion('MX')];
    }
    if (region.code[0] == 'C') {
      return [this.codeToRegion('TX'), this.codeToRegion('US')];
    }
    return [this.codeToRegion('US')];
  }

  getDescendantRegions(underGeographyID: number): Region[] {
    const region = this.regionsByID[underGeographyID];
    if (region.code[0] == 'C' || (region.code != 'MX' && region.code[0] == 'M')) {
      return [];
    }

    const childRegionsWithDups: DummyRegion[] = [];
    for (const regionRow of this._regionMatrix) {
      for (const testRegion of regionRow) {
        if (region.code == 'MX') {
          if (region.code[0] == 'M') {
            childRegionsWithDups.push(testRegion);
          }
        } else if (region.code == 'US') {
          if (testRegion.code[0] != 'M') {
            childRegionsWithDups.push(testRegion);
          }
        } else if (region.code == 'TX') {
          if (testRegion.code[0] == 'C') {
            childRegionsWithDups.push(testRegion);
          }
        }
      }
    }
    if (region.code == 'US') {
      childRegionsWithDups.push(this.regionsByCode['TX']);
    }
    return this._removeDupRegions(childRegionsWithDups).map(
      (region) => region.actualRegion
    );
  }

  getLocalityCount(forSingleGeographicID: number): number {
    return this.regionsByID[forSingleGeographicID].localityTotal;
  }

  getDomainRegions(): Region[] {
    const domainRegions: Region[] = [];
    for (const dummyRegion of Object.values(this.regionsByID)) {
      if (dummyRegion.inDomain) {
        domainRegions.push(dummyRegion.actualRegion);
      }
    }
    return domainRegions;
  }

  getRegionMatrixString(regionRoster: TrackedRegionRoster): string {
    let s = '';
    for (const regionRow of this._regionMatrix) {
      s += '  ';
      s += regionRow
        .map((column) => {
          const trackedRegion = regionRoster.getByID(column.actualRegion.id);
          return column.toState(trackedRegion);
        })
        .join(' | ');
      s += '\n';
    }
    return s;
  }

  private _getAdjacentRegions(toGeographyID: number): DummyRegion[] {
    const region = this.regionsByID[toGeographyID];
    const adjacentRegionsWithDups: DummyRegion[] = [];

    if (region.code == 'TX') {
      for (const regionRow of this._regionMatrix) {
        for (const testRegion of regionRow) {
          if (testRegion.code[0] != 'C') {
            adjacentRegionsWithDups.push(testRegion);
          }
        }
      }
      adjacentRegionsWithDups.push(this.regionsByCode['MX']);
    } else if (region.code == 'US') {
      for (const regionRow of this._regionMatrix) {
        for (const testRegion of regionRow) {
          if (testRegion.code[0] == 'M') {
            adjacentRegionsWithDups.push(testRegion);
          }
        }
      }
      adjacentRegionsWithDups.push(this.regionsByCode['MX']);
    } else if (region.code == 'MX') {
      for (const regionRow of this._regionMatrix) {
        for (const testRegion of regionRow) {
          if (testRegion.code[0] != 'M') {
            for (const adjacentToTest of this._getAdjacentRegions(
              testRegion.actualRegion.id
            )) {
              if (adjacentToTest.code[0] == 'M') {
                adjacentRegionsWithDups.push(testRegion);
              }
            }
          }
        }
      }
      adjacentRegionsWithDups.push(this.regionsByCode['TX']);
      adjacentRegionsWithDups.push(this.regionsByCode['US']);
    } else {
      const indexPairs = this._getRegionIndexPairs(region);
      for (const indexPair of indexPairs) {
        const touchingRegions = this._getTouchingRegions(
          indexPair[0],
          indexPair[1],
          this._withCornerAdjacency
        );
        for (const touchingRegion of touchingRegions) {
          if (touchingRegion != region) {
            adjacentRegionsWithDups.push(touchingRegion);
            if (touchingRegion.code[0] == 'M' && region.code[0] != 'M') {
              adjacentRegionsWithDups.push(this.regionsByCode['MX']);
            }
          }
        }
      }
      if (['LA', 'NM'].includes(region.code)) {
        adjacentRegionsWithDups.push(this.regionsByCode['TX']);
      } else if (region.code[0] == 'M') {
        // municipality of mexico
        adjacentRegionsWithDups.push(this.regionsByCode['TX']);
        adjacentRegionsWithDups.push(this.regionsByCode['US']);
      }
    }

    return this._removeDupRegions(adjacentRegionsWithDups);
  }

  codeToID(code: string): number {
    return this.regionsByCode[code].actualRegion.id;
  }

  codeToRegion(code: string): Region {
    return this.regionsByCode[code].actualRegion;
  }

  // A single region may span multiple cells of the matrix.
  // Return the indexes of each of those cells.

  _getRegionIndexPairs(region: DummyRegion): number[][] {
    const indexPairs: number[][] = [];
    for (let i = 0; i < this._regionMatrix.length; ++i) {
      const regionRow = this._regionMatrix[i];
      for (let j = 0; j < regionRow.length; ++j) {
        if (this._regionMatrix[i][j] === region) {
          indexPairs.push([i, j]);
        }
      }
    }
    return indexPairs;
  }

  _getTouchingRegions(
    rowIndex: number,
    columnIndex: number,
    withCornerTouching: boolean
  ): DummyRegion[] {
    const touchingRegions: DummyRegion[] = [];
    for (let deltaI = -1; deltaI <= 1; ++deltaI) {
      for (let deltaJ = -1; deltaJ <= 1; ++deltaJ) {
        const i = rowIndex + deltaI;
        const j = columnIndex + deltaJ;
        if (!withCornerTouching && deltaI != 0 && deltaJ != 0) {
          continue;
        }
        if (deltaI != 0 || deltaJ != 0) {
          if (i >= 0 && i < this._regionMatrix.length) {
            if (j >= 0 && j < this._regionMatrix[i].length) {
              touchingRegions.push(this._regionMatrix[i][j]);
            }
          }
        }
      }
    }
    return touchingRegions;
  }

  _indexDummyRegion(region: DummyRegion): void {
    this.regionsByCode[region.code] = region;
    this.regionsByID[region.actualRegion.id] = region;
  }

  _removeDupRegions(regionsWithDups: DummyRegion[]): DummyRegion[] {
    const _regionMatrix: DummyRegion[] = [];
    for (const region of regionsWithDups) {
      if (!_regionMatrix.includes(region)) {
        _regionMatrix.push(region);
      }
    }
    return _regionMatrix;
  }
}

class DummyRegion {
  code: string;
  inDomain: boolean;
  sequence = 0;
  localityTotal: number;
  actualRegion: Region;

  constructor(
    code: string,
    inDomain: boolean,
    localityTotal: number,
    actualRegion: Region
  ) {
    this.code = code;
    this.inDomain = inDomain;
    this.localityTotal = localityTotal;
    this.actualRegion = actualRegion;
  }

  toState(trackedRegion: TrackedRegion | null): string {
    const status = trackedRegion ? trackedRegion.status : TrackedRegionStatus.Pending;
    const adjoiningPendingCount = trackedRegion
      ? trackedRegion.adjoiningPendingCount
      : 0;

    let s = status == TrackedRegionStatus.Cached ? '*' : '';
    s += `${this.code}:${adjoiningPendingCount}`;
    if (this.sequence > 0) {
      s = `(${this.sequence})${s}`;
    }
    if (status == TrackedRegionStatus.Complete) {
      s = '✓' + s;
    }
    return s.padEnd(10, ' ');
  }

  toString(): string {
    const rankToAbbrev: Record<RegionRank, string> = {
      [RegionRank.County]: 'c',
      [RegionRank.State]: 's',
      [RegionRank.Country]: 'y',
      [RegionRank.Continent]: '-',
      [RegionRank.Earth]: '-'
    };
    return `${this.inDomain ? '' : 'a'}${rankToAbbrev[this.actualRegion.rank]}-${
      this.code
    }-${this.localityTotal}`;
  }
}

class DummyLocalityCache implements LocalityCache {
  private _scenario: RegionScenario;
  private _cache: Record<number, CachedLocality> = {};
  private _cachedCodes: string[] = []; // in caching order

  constructor(scenario: RegionScenario) {
    this._scenario = scenario;
  }

  cacheRegionLocalities(region: TrackedRegion): void {
    this._cache[region.id] = {
      localityID: region.id,
      regionID: region.id,
      lastModified: Date.now(),
      latitude: 0,
      longitude: 0,
      name: 'Dummy Locality Name',
      phonemes: '',
      remarks: ''
    };
    this._cachedCodes.push(this._scenario.regionsByID[region.id].code);
  }

  getCachedCodes(): string[] {
    return this._cachedCodes;
  }

  getLocality(localityID: number): CachedLocality {
    return this._cache[localityID];
  }

  uncacheLocality(localityID: number): void {
    delete this._cache[localityID];
    const code = this._scenario.regionsByID[localityID].code; // localityID == regionID
    const codeIndex = this._cachedCodes.indexOf(code);
    this._cachedCodes.splice(codeIndex, 1);
  }
}

class TestDiagnostics implements Diagnostics {
  private _scenario: RegionScenario;
  private _fileDesc: number;
  private _localityCache: DummyLocalityCache;
  private _showSecondaryState: boolean;
  private _lastSequenceNumber = 0;

  constructor(
    scenario: RegionScenario,
    localityCache: DummyLocalityCache,
    fileName: string,
    showSecondaryState: boolean = true
  ) {
    this._scenario = scenario;
    this._localityCache = localityCache;
    const filePath = path.join(TEST_LOG_DIR, fileName);
    try {
      fs.accessSync(filePath);
    } catch (err) {
      try {
        fs.mkdirSync(TEST_LOG_DIR);
      } catch (err) {}
    }
    this._showSecondaryState = showSecondaryState;
    this._fileDesc = fs.openSync(filePath, 'w');
  }

  reportPrimaryState(
    regionRoster: TrackedRegionRoster,
    primaryContext: string,
    newlyProcessedRegion?: TrackedRegion
  ): void {
    if (newlyProcessedRegion) {
      this._scenario.regionsByID[newlyProcessedRegion.id].sequence = ++this
        ._lastSequenceNumber;
    }
    this._writeState(regionRoster, '### ' + primaryContext);
  }

  reportSecondaryProcess(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion
  ): void {
    fs.writeSync(
      this._fileDesc,
      `${primaryContext} - ${secondaryContext} (${
        this._scenario.regionsByID[forRegion.id].code
      })...\n\n`
    );
  }

  reportSecondaryState(
    regionRoster: TrackedRegionRoster,
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): void {
    if (this._showSecondaryState) {
      const aroundText = aroundRegion
        ? `around ${this._scenario.regionsByID[aroundRegion.id].code}: `
        : '';
      const description = `${primaryContext} - ${secondaryContext} (${aroundText}${
        this._scenario.regionsByID[forRegion.id].code
      })`;
      this._writeState(regionRoster, description);
    }
  }

  close() {
    fs.close(this._fileDesc);
  }

  private _writeState(regionRoster: TrackedRegionRoster, description: string) {
    let s = description + ':\n';
    s += '  Region roster: ';
    s += [...regionRoster].map((r) => this._scenario.regionsByID[r.id].code).join(', ');
    s += '\n  Cached localities(*): ';
    s += this._localityCache.getCachedCodes().join(', ');
    s += '\n\n';
    s += this._scenario.getRegionMatrixString(regionRoster);
    s += '\n  ';
    s += [
      this._scenario.codeToID('TX'),
      this._scenario.codeToID('US'),
      this._scenario.codeToID('MX')
    ]
      .map((id) => {
        const trackedRegion = regionRoster.getByID(id);
        return this._scenario.regionsByID[id].toState(trackedRegion);
      })
      .join(' | ');
    s += '\n\n';
    fs.writeSync(this._fileDesc, s);
  }
}
