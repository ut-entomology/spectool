import * as path from 'path';
import * as fs from 'fs';

import { AdjoiningRegions } from './adjoining_regions';
import { AdjoiningRegionDriver, Diagnostics } from './region_driver';
import type { LocalityCache } from './locality_cache';
import { Region, RegionRank } from '../../shared/region';
import { TrackedRegionRoster } from './region_roster';
import { TrackedRegion, TrackedRegionStatus } from './tracked_region';

const TEST_LOG_DIR = path.join(__dirname, '../../../test_logs');

class DummyRegion {
  code: string;
  inDomain: boolean;
  sequence = 0;
  processed = false;
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
    if (this.processed && status == TrackedRegionStatus.Complete) {
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

// Explanation of dummy region data:

// 'a' prefix means it's adjacent, not in the domain
// 'c-' prefix means county or municipality
// 's-' prefix means state
// 'y-' prefix means country
// Capital letter sequence designates a region
// dash-number indicates the number of localities in the region
// < indicates that the region to the left extends to this point
// ^ indicates that the region above extends to this point

const regionData = `
  as-MA-1|<     |<     |as-MB-1
  c-CA-1 |c-CB-1|c-CC-1|c-CD-1 |as-NM-1
  c-CE-1 |c-CF-1|c-CG-1|c-CH-1 |^
  c-CI-1 |c-CJ-1|c-CK-1|c-CL-1 |as-LA-1
`;

const regionMatrix: DummyRegion[][] = [];
const regionsByCode: Record<string, DummyRegion> = {};
const regionsByID: Record<number, DummyRegion> = {};

describe('locality consolidator', () => {
  test('processes regions in correct order', async () => {
    makeRegionMatrix(); // call before collecting domain regions

    const processedRegionIDs: number[] = [];
    const domainRegions: Region[] = [];
    for (const dummyRegion of Object.values(regionsByID)) {
      if (dummyRegion.inDomain) {
        domainRegions.push(dummyRegion.actualRegion);
      }
    }
    const localityCache = new DummyLocalityCache();
    const diagnostics = new TestDiagnostics(localityCache, 'region-driver-1.txt');

    const regionDriver = new AdjoiningRegionDriver(
      new DummyAdjoiningRegions(),
      domainRegions,
      localityCache,
      (region) => {
        processedRegionIDs.push(region.id);
        localityCache.uncacheLocality(region.id);
      },
      diagnostics,
      _codeToRegion('CB').id
    );
    await regionDriver.run();
    diagnostics.close();

    expect(processedRegionIDs.map((id) => regionsByID[id].code)).toEqual([
      /* TBD: region codes in correct order */
    ]);
  });
});

function makeRegionMatrix(): void {
  indexDummyRegion(
    new DummyRegion('US', false, 1, new Region(100, RegionRank.Country, 'US', 0))
  );
  indexDummyRegion(
    new DummyRegion('TX', true, 1, new Region(101, RegionRank.State, 'TX', 0))
  );
  indexDummyRegion(
    new DummyRegion('MX', false, 1, new Region(102, RegionRank.Country, 'MX', 0))
  );

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

      const units = column.trim().split('-');
      if (units[0] == '<') {
        regionRow.push(regionRow[columnIndex - 1]);
      } else if (units[0] == '^') {
        regionRow.push(regionMatrix[rowIndex - 1][columnIndex]);
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
        const region = new DummyRegion(
          code,
          inDomain,
          localityTotal,
          new Region(nextID++, rank, code, 0)
        );
        regionRow.push(region);
        indexDummyRegion(region);
      }
      columnIndex += 1;
    }
    rowIndex += 1;
    regionMatrix.push(regionRow);
  }
}

function indexDummyRegion(region: DummyRegion): void {
  regionsByCode[region.code] = region;
  regionsByID[region.actualRegion.id] = region;
}

function removeDupRegions(regionsWithDups: DummyRegion[]): DummyRegion[] {
  const regionMatrix: DummyRegion[] = [];
  for (const region of regionsWithDups) {
    if (!regionMatrix.includes(region)) {
      regionMatrix.push(region);
    }
  }
  return regionMatrix;
}

// A single region may span multiple cells of the matrix.
// Return the indexes of each of those cells.

function getRegionIndexPairs(region: DummyRegion): number[][] {
  const indexPairs: number[][] = [];
  for (let i = 0; i < regionMatrix.length; ++i) {
    const regionRow = regionMatrix[i];
    for (let j = 0; j < regionRow.length; ++j) {
      if (regionMatrix[i][j] === region) {
        indexPairs.push([i, j]);
      }
    }
  }
  return indexPairs;
}

function getTouchingRegions(
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
        if (i >= 0 && i < regionMatrix.length) {
          if (j >= 0 && j < regionMatrix[i].length) {
            touchingRegions.push(regionMatrix[i][j]);
          }
        }
      }
    }
  }
  return touchingRegions;
}

class DummyAdjoiningRegions implements AdjoiningRegions {
  getAdjacentRegions(toGeographyID: number): Region[] {
    return this._getAdjacentRegions(toGeographyID).map((region) => region.actualRegion);
  }

  getContainingRegions(aboveGeographyID: number): Region[] {
    const region = regionsByID[aboveGeographyID];
    if (['US', 'MX'].includes(region.code)) {
      return [];
    }
    if (region.code[0] == 'M') {
      return [_codeToRegion('MX')];
    }
    if (region.code[0] == 'C') {
      return [_codeToRegion('TX'), _codeToRegion('US')];
    }
    return [_codeToRegion('US')];
  }

  getDescendantRegions(underGeographyID: number): Region[] {
    const region = regionsByID[underGeographyID];
    if (region.code[0] == 'C' || (region.code != 'MX' && region.code[0] == 'M')) {
      return [];
    }

    const childRegionsWithDups: DummyRegion[] = [];
    for (const regionRow of regionMatrix) {
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
      childRegionsWithDups.push(regionsByCode['TX']);
    }
    return removeDupRegions(childRegionsWithDups).map((region) => region.actualRegion);
  }

  getLocalityCount(forSingleGeographicID: number): number {
    return regionsByID[forSingleGeographicID].localityTotal;
  }

  private _getAdjacentRegions(toGeographyID: number): DummyRegion[] {
    const region = regionsByID[toGeographyID];
    const adjacentRegionsWithDups: DummyRegion[] = [];

    if (region.code == 'TX') {
      for (const regionRow of regionMatrix) {
        for (const testRegion of regionRow) {
          if (testRegion.code[0] != 'C') {
            adjacentRegionsWithDups.push(testRegion);
          }
        }
      }
      adjacentRegionsWithDups.push(regionsByCode['MX']);
    } else if (region.code == 'US') {
      for (const regionRow of regionMatrix) {
        for (const testRegion of regionRow) {
          if (testRegion.code[0] == 'M') {
            adjacentRegionsWithDups.push(testRegion);
          }
        }
      }
      adjacentRegionsWithDups.push(regionsByCode['MX']);
    } else if (region.code == 'MX') {
      for (const regionRow of regionMatrix) {
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
      adjacentRegionsWithDups.push(regionsByCode['TX']);
      adjacentRegionsWithDups.push(regionsByCode['US']);
    } else {
      const indexPairs = getRegionIndexPairs(region);
      for (const indexPair of indexPairs) {
        const touchingRegions = getTouchingRegions(indexPair[0], indexPair[1], false);
        for (const touchingRegion of touchingRegions) {
          if (touchingRegion != region) {
            adjacentRegionsWithDups.push(touchingRegion);
            if (touchingRegion.code[0] == 'M' && region.code[0] != 'M') {
              adjacentRegionsWithDups.push(regionsByCode['MX']);
            }
          }
        }
      }
      if (['LA', 'NM'].includes(region.code)) {
        adjacentRegionsWithDups.push(regionsByCode['TX']);
      } else if (region.code[0] == 'M') {
        // municipality of mexico
        adjacentRegionsWithDups.push(regionsByCode['TX']);
        adjacentRegionsWithDups.push(regionsByCode['US']);
      }
    }

    return removeDupRegions(adjacentRegionsWithDups);
  }
}

export interface CachedLocality {
  localityID: number;
  regionID: number;
  lastModified: number; // UNIX time
  latitude: number;
  longitude: number;
  name: string;
  phonemes: string;
  remarks: string;
}

class DummyLocalityCache implements LocalityCache {
  private _cache: Record<number, CachedLocality> = {};
  private _cachedCodes: string[] = []; // in caching order

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
    this._cachedCodes.push(regionsByID[region.id].code);
  }

  getCachedCodes(): string[] {
    return this._cachedCodes;
  }

  getLocality(localityID: number): CachedLocality {
    return this._cache[localityID];
  }

  uncacheLocality(localityID: number): void {
    delete this._cache[localityID];
    const code = regionsByID[localityID].code; // localityID == regionID
    const codeIndex = this._cachedCodes.indexOf(code);
    this._cachedCodes.splice(codeIndex, 1);
  }
}

function _codeToID(code: string): number {
  return regionsByCode[code].actualRegion.id;
}

function _codeToRegion(code: string): Region {
  return regionsByCode[code].actualRegion;
}

class TestDiagnostics implements Diagnostics {
  private _fileID: number;
  private _localityCache: DummyLocalityCache;
  private _showSecondaryState: boolean;
  private _lastSequenceNumber = 0;

  constructor(
    localityCache: DummyLocalityCache,
    fileName: string,
    showSecondaryState: boolean = true
  ) {
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
    this._fileID = fs.openSync(filePath, 'w');
  }

  reportPrimaryState(
    regionRoster: TrackedRegionRoster,
    primaryContext: string,
    newlyProcessedRegion?: TrackedRegion
  ): void {
    if (newlyProcessedRegion) {
      regionsByID[newlyProcessedRegion.id].sequence = ++this._lastSequenceNumber;
    }
    this._writeState(regionRoster, '### ' + primaryContext);
  }

  reportSecondaryProcess(
    primaryContext: string,
    secondaryContext: string,
    forRegion: TrackedRegion
  ): void {
    fs.writeSync(
      this._fileID,
      `${primaryContext} - ${secondaryContext} (${
        regionsByID[forRegion.id].code
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
        ? `around ${regionsByID[aroundRegion.id].code}: `
        : '';
      const description = `${primaryContext} - ${secondaryContext} (${aroundText}${
        regionsByID[forRegion.id].code
      })`;
      this._writeState(regionRoster, description);
    }
  }

  close() {
    fs.close(this._fileID);
  }

  private _writeState(regionRoster: TrackedRegionRoster, description: string) {
    let s = description + ':\n';
    s += '  Region roster: ';
    s += [...regionRoster].map((r) => regionsByID[r.id].code).join(', ');
    s += '\n  Cached localities(*): ';
    s += this._localityCache.getCachedCodes().join(', ');
    s += '\n\n';
    for (const regionRow of regionMatrix) {
      s += '  ';
      s += regionRow
        .map((column) => {
          const trackedRegion = regionRoster.getByID(column.actualRegion.id);
          return column.toState(trackedRegion);
        })
        .join(' | ');
      s += '\n';
    }
    s += '\n  ';
    s += [_codeToID('TX'), _codeToID('US'), _codeToID('MX')]
      .map((id) => {
        const trackedRegion = regionRoster.getByID(id);
        return regionsByID[id].toState(trackedRegion);
      })
      .join(' | ');
    s += '\n\n';
    fs.writeSync(this._fileID, s);
  }
}
