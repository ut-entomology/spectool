import * as path from 'path';
import * as fs from 'fs';

import type { RegionAccess } from './region_access';
import { AdjoiningRegionDriver, Diagnostics } from './region_driver';
import { CachedLocality } from './cached_locality';
import type { LocalityCache } from './locality_cache';
import { Region, RegionRank } from '../../shared/shared_geography';
import type { TrackedRegionRoster } from './region_roster';
import { MockTrackedRegionRoster } from './mock/mock_region_roster';
import { TrackedRegion, TrackedRegionStatus } from './tracked_region';

const TEST_LOG_DIR = path.join(__dirname, '../../../test_logs');

interface TestSpec {
  regionGrid: string;
  containingTotals: Record<string, number>;
  withCornerAdjacency: boolean;
  initialRegion: string;
  expectedProcessOrder: string;
}

// Explanation of region grid string data:

// 'a' prefix means it's adjacent, not in the domain
// 'c-' prefix means county or municipality
// 's-' prefix means state
// 'y-' prefix means country
// Capital letter sequence designates a region
// dash-number indicates the number of localities in the region
// < indicates that the region to the left extends to this point
// ^ indicates that the region above extends to this point

describe('locality consolidator region process order', () => {
  test('equal localities, without corner adjacency', async () => {
    await runTest(1, {
      regionGrid: `
        as-MA-1|<     |<     |as-MB-1
        c-CA-1 |c-CB-1|c-CC-1|c-CD-1 |as-NM-1
        c-CE-1 |c-CF-1|c-CG-1|c-CH-1 |^
        c-CI-1 |c-CJ-1|c-CK-1|c-CL-1 |as-LA-1`,
      containingTotals: { US: 1, TX: 1, MX: 1 },
      withCornerAdjacency: false,
      initialRegion: 'CB',
      expectedProcessOrder: 'CB,MA,CA,CE,CI,CF,CC,MX,CJ,CG,CK,US,CH,NM,CD,MB,CL,TX,LA'
    });
  });

  test('equal localities, with corner adjacency', async () => {
    await runTest(2, {
      regionGrid: `
        as-MA-1|<     |<     |as-MB-1
        c-CA-1 |c-CB-1|c-CC-1|c-CD-1 |as-NM-1
        c-CE-1 |c-CF-1|c-CG-1|c-CH-1 |^
        c-CI-1 |c-CJ-1|c-CK-1|c-CL-1 |as-LA-1`,
      containingTotals: { US: 1, TX: 1, MX: 1 },
      withCornerAdjacency: true,
      initialRegion: 'CB',
      expectedProcessOrder: 'CB,CA,MA,MX,CC,MB,CD,NM,CE,CI,CF,CG,CJ,CK,US,CH,CL,TX,LA'
    });
  });

  test('unequal localities, without corner adjacency', async () => {
    await runTest(3, {
      regionGrid: `
        as-MA-1|<     |<     |as-MB-0
        c-CA-4 |c-CB-1|c-CC-1|c-CD-1 |as-NM-2
        c-CE-1 |c-CF-0|c-CG-2|c-CH-1 |^
        c-CI-1 |c-CJ-0|c-CK-1|c-CL-3 |as-LA-0`,
      containingTotals: { US: 1, TX: 1, MX: 1 },
      withCornerAdjacency: false,
      initialRegion: 'CB',
      // CJ and LA are not processed
      expectedProcessOrder: 'CB,MA,CA,CE,CI,MX,CC,CF,CG,CD,MB,NM,CH,CK,CL,TX,US'
    });
  });

  test('isolated localities, without corner adjacency', async () => {
    await runTest(4, {
      regionGrid: `
      as-MA-1|<     |<     |as-MB-0
      c-CA-4 |c-CB-0|c-CC-0|c-CD-1 |as-NM-2
      c-CE-1 |c-CF-0|c-CG-1|c-CH-0 |^
      c-CI-1 |c-CJ-0|c-CK-0|c-CL-0 |as-LA-0`,
      containingTotals: { US: 0, TX: 0, MX: 0 },
      withCornerAdjacency: false,
      initialRegion: 'CA',
      // CK, CL, and LA are not processed
      expectedProcessOrder: 'CA,CB,MA,CE,CI,CF,CG,CJ,MX,CC,US,CD,CH,TX,MB,NM'
    });
  });
});

async function runTest(testID: number, spec: TestSpec) {
  const scenario = new RegionScenario(
    spec.regionGrid,
    spec.containingTotals,
    spec.withCornerAdjacency
  );

  const processedRegionIDs: number[] = [];
  const regionRoster = new MockTrackedRegionRoster();
  const localityCache = new MockLocalityCache(scenario);
  const diagnostics = new TestDiagnostics(
    scenario,
    regionRoster,
    localityCache,
    `region-driver-${testID}.txt`
  );

  const regionDriver = new AdjoiningRegionDriver(
    scenario,
    scenario.getDomainRegions(),
    new MockTrackedRegionRoster(),
    localityCache,
    diagnostics,
    scenario.codeToRegion(spec.initialRegion).id
  );
  for await (const region of regionDriver.run()) {
    if (region != null) {
      processedRegionIDs.push(region.id);
      await localityCache.uncacheLocality(region.id);
    }
  }
  diagnostics.close();

  expect(processedRegionIDs.map((id) => scenario.regionsByID[id].code)).toEqual(
    spec.expectedProcessOrder.split(',')
  );
}

class RegionScenario implements RegionAccess {
  private _withCornerAdjacency: boolean;
  private _regionMatrix: MockRegion[][] = [];

  regionsByCode: Record<string, MockRegion> = {};
  regionsByID: Record<number, MockRegion> = {};

  constructor(
    regionGrid: string,
    containingLocalityTotals: Record<string, number>,
    withCornerAdjacency: boolean
  ) {
    this._withCornerAdjacency = withCornerAdjacency;

    // Define regions not in the matrix.

    this._indexMockRegion(
      new MockRegion(
        'US',
        false,
        containingLocalityTotals['US'],
        new Region(100, RegionRank.Country, 'US', 0)
      )
    );
    this._indexMockRegion(
      new MockRegion(
        'TX',
        true,
        containingLocalityTotals['TX'],
        new Region(101, RegionRank.State, 'TX', 0)
      )
    );
    this._indexMockRegion(
      new MockRegion(
        'MX',
        false,
        containingLocalityTotals['MX'],
        new Region(102, RegionRank.Country, 'MX', 0)
      )
    );

    // Create a region for each cell of the matrix.

    const rows = regionGrid.trim().split('\n');
    let rowIndex = 0;
    let nextID = 1;
    for (const row of rows) {
      if (row.trim() == '') {
        continue;
      }
      const regionRow: MockRegion[] = [];
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
          const mockRegion = new MockRegion(code, inDomain, localityTotal, region);
          regionRow.push(mockRegion);
          this._indexMockRegion(mockRegion);

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
    // can be simplified now that I'm using parentID, but this works
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

  getContainedRegions(underGeographyID: number): Region[] {
    // can be simplified now that I'm using parentID, but this works
    const region = this.regionsByID[underGeographyID];
    if (region.code[0] == 'C' || (region.code != 'MX' && region.code[0] == 'M')) {
      return [];
    }

    const childRegionsWithDups: MockRegion[] = [];
    for (const regionRow of this._regionMatrix) {
      for (const testRegion of regionRow) {
        if (region.code == 'MX') {
          if (testRegion.code[0] == 'M') {
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
    for (const mockRegion of Object.values(this.regionsByID)) {
      if (mockRegion.inDomain) {
        domainRegions.push(mockRegion.actualRegion);
      }
    }
    return domainRegions;
  }

  async getRegionMatrixString(regionRoster: TrackedRegionRoster): Promise<string> {
    let s = '';
    for (const regionRow of this._regionMatrix) {
      s += '  ';
      const columnStates: string[] = [];
      for (const column of regionRow) {
        const trackedRegion = await regionRoster.getByID(column.actualRegion.id);
        columnStates.push(column.toState(trackedRegion));
      }
      s += columnStates.join(' | ');
      s += '\n';
    }
    return s;
  }

  private _getAdjacentRegions(toGeographyID: number): MockRegion[] {
    const region = this.regionsByID[toGeographyID];
    const adjacentRegionsWithDups: MockRegion[] = [];

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

  _getRegionIndexPairs(region: MockRegion): number[][] {
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
  ): MockRegion[] {
    const touchingRegions: MockRegion[] = [];
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

  _indexMockRegion(region: MockRegion): void {
    this.regionsByCode[region.code] = region;
    this.regionsByID[region.actualRegion.id] = region;
  }

  _removeDupRegions(regionsWithDups: MockRegion[]): MockRegion[] {
    const _regionMatrix: MockRegion[] = [];
    for (const region of regionsWithDups) {
      if (!_regionMatrix.includes(region)) {
        _regionMatrix.push(region);
      }
    }
    return _regionMatrix;
  }
}

class MockRegion {
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

class MockLocalityCache implements LocalityCache {
  private _scenario: RegionScenario;
  private _cache: Record<number, CachedLocality> = {};
  private _cachedCodes: string[] = []; // in caching order

  constructor(scenario: RegionScenario) {
    this._scenario = scenario;
  }

  //// INTERFACE LocalityCache ///////////////////////////////////////////////

  async cacheRegionLocalities(region: TrackedRegion): Promise<void> {
    this._cache[region.id] = new CachedLocality(
      region,
      region.id,
      0,
      0,
      'Mock Locality Name',
      '',
      Date.now()
    );
    this._cachedCodes.push(this._scenario.regionsByID[region.id].code);
  }

  async getLocality(localityID: number): Promise<CachedLocality> {
    return this._cache[localityID];
  }

  async *localitiesOfRegion(
    _region: TrackedRegion
  ): AsyncGenerator<CachedLocality, void, void> {
    // not needed for this test
  }

  async uncacheLocality(localityID: number): Promise<void> {
    delete this._cache[localityID];
    const code = this._scenario.regionsByID[localityID].code; // localityID == regionID
    const codeIndex = this._cachedCodes.indexOf(code);
    this._cachedCodes.splice(codeIndex, 1);
  }

  //// Mock Support //////////////////////////////////////////////////////////

  getCachedCodes(): string[] {
    return this._cachedCodes;
  }
}

class TestDiagnostics implements Diagnostics {
  private _scenario: RegionScenario;
  private _regionRoster: MockTrackedRegionRoster;
  private _fileDesc: number;
  private _localityCache: MockLocalityCache;
  private _showSecondaryState: boolean;
  private _lastSequenceNumber = 0;

  constructor(
    scenario: RegionScenario,
    regionRoster: MockTrackedRegionRoster,
    localityCache: MockLocalityCache,
    fileName: string,
    showSecondaryState: boolean = true
  ) {
    this._scenario = scenario;
    this._regionRoster = regionRoster;
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

  async reportPrimaryState(
    primaryContext: string,
    newlyProcessedRegion?: TrackedRegion
  ): Promise<void> {
    if (newlyProcessedRegion) {
      this._scenario.regionsByID[newlyProcessedRegion.id].sequence = ++this
        ._lastSequenceNumber;
    }
    await this._writeState(this._regionRoster, '### ' + primaryContext);
  }

  async reportSecondaryProcess(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion
  ): Promise<void> {
    fs.writeSync(
      this._fileDesc,
      `${primaryContext} - ${secondaryContext} (${
        this._scenario.regionsByID[forRegion.id].code
      })...\n\n`
    );
  }

  async reportSecondaryState(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion,
    aroundRegion: TrackedRegion
  ): Promise<void> {
    if (this._showSecondaryState) {
      const aroundText = aroundRegion
        ? `around ${this._scenario.regionsByID[aroundRegion.id].code}: `
        : '';
      const description = `${primaryContext} - ${secondaryContext} (${aroundText}${
        this._scenario.regionsByID[forRegion.id].code
      })`;
      await this._writeState(this._regionRoster, description);
    }
  }

  close() {
    fs.close(this._fileDesc);
  }

  private async _writeState(
    regionRoster: MockTrackedRegionRoster,
    description: string
  ) {
    const regions: TrackedRegion[] = [];
    for await (const region of regionRoster.allRegions()) {
      regions.push(region);
    }
    let s = description + ':\n';
    s += '  Region roster: ';
    s += regions.map((r) => this._scenario.regionsByID[r.id].code).join(', ');
    s += '\n  Cached localities(*): ';
    s += this._localityCache.getCachedCodes().join(', ');
    s += '\n\n';
    s += await this._scenario.getRegionMatrixString(regionRoster);
    s += '\n  ';
    const columnStates: string[] = [];
    const ids = [
      this._scenario.codeToID('TX'),
      this._scenario.codeToID('US'),
      this._scenario.codeToID('MX')
    ];
    for (const id of ids) {
      const trackedRegion = await regionRoster.getByID(id);
      columnStates.push(this._scenario.regionsByID[id].toState(trackedRegion));
    }
    s += columnStates.join(' | ');
    s += '\n\n';
    fs.writeSync(this._fileDesc, s);
  }
}
