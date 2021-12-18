export {};

let regions: ProtoRegion[][] = [];
let regionRoster: ProtoRegion[] = [];
let cachedLocalities: ProtoRegion[] = [];

enum RegionStatus {
  Pending,
  Cached,
  Complete
}

class ProtoRegion {
  code: string;
  rank: string;
  inDomain: boolean;
  localityTotal: number;
  status = RegionStatus.Pending;
  adjacentUncachedCount = 0;
  sequence = 0;
  processed = false;

  constructor(code: string, rank: string, inDomain: boolean, localityTotal: number) {
    this.code = code;
    this.rank = rank;
    this.inDomain = inDomain;
    this.localityTotal = localityTotal;
  }

  toState(): string {
    let s = this.status == RegionStatus.Cached ? '*' : '';
    s += `${this.code}:${this.adjacentUncachedCount}`;
    if (this.sequence > 0) {
      s = `(${this.sequence})${s}`;
    }
    if (this.processed && this.status == RegionStatus.Complete) {
      s = '✓' + s;
    }
    return s.padEnd(10, ' ');
  }

  toString(): string {
    const rankToAbbrev: Record<string, string> = {
      county: 'c',
      state: 's',
      country: 'y'
    };
    return `${this.inDomain ? '' : 'a'}${rankToAbbrev[this.rank]}-${this.code}-${
      this.localityTotal
    }`;
  }
}

// 'a' prefix means it's adjacen, not in the domain
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
const usa = new ProtoRegion('US', 'y', false, 1);
const texas = new ProtoRegion('TX', 's', true, 1);
const mexico = new ProtoRegion('MX', 'y', false, 1);
const overDomain = [usa];

function makeRegionMatrix(regionData: string): ProtoRegion[][] {
  const rows = regionData.split('\n');
  let rowIndex = 0;
  for (const row of rows) {
    if (row.trim() == '') {
      continue;
    }
    const regionRow: ProtoRegion[] = [];
    let columnIndex = 0;
    const columns = row.split('|');
    for (const column of columns) {
      let code: string;
      let rank: string;
      let inDomain = true;
      let localityTotal: number;

      const units = column.trim().split('-');
      if (units[0] == '<') {
        regionRow.push(regionRow[columnIndex - 1]);
      } else if (units[0] == '^') {
        regionRow.push(regions[rowIndex - 1][columnIndex]);
      } else {
        if (units[0][0] == 'a') {
          inDomain = false;
          units[0] = units[0].substr(1);
        }
        switch (units[0][0]) {
          case 'c':
            rank = 'county';
            break;
          case 's':
            rank = 'state';
            break;
          case 'y':
            rank = 'country';
            break;
          default:
            throw Error(`Unrecognized rank '${units[0][0]}' in column '${column}'`);
        }
        code = units[1];
        localityTotal = parseInt(units[2]);
        regionRow.push(new ProtoRegion(code, rank, inDomain, localityTotal));
      }
      columnIndex += 1;
    }
    rowIndex += 1;
    regions.push(regionRow);
  }
  return regions;
}

function removeDupRegions(regionsWithDups: ProtoRegion[]): ProtoRegion[] {
  const regions: ProtoRegion[] = [];
  for (const region of regionsWithDups) {
    if (!regions.includes(region)) {
      regions.push(region);
    }
  }
  return regions;
}

// A single region may span multiple cells of the matrix.
// Return the indexes of each of those cells.

function getRegionIndexPairs(region: ProtoRegion): number[][] {
  const indexPairs: number[][] = [];
  for (let i = 0; i < regions.length; ++i) {
    const regionRow = regions[i];
    for (let j = 0; j < regionRow.length; ++j) {
      if (regions[i][j] === region) {
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
): ProtoRegion[] {
  const touchingRegions: ProtoRegion[] = [];
  for (let deltaI = -1; deltaI <= 1; ++deltaI) {
    for (let deltaJ = -1; deltaJ <= 1; ++deltaJ) {
      const i = rowIndex + deltaI;
      const j = columnIndex + deltaJ;
      if (!withCornerTouching && deltaI != 0 && deltaJ != 0) {
        continue;
      }
      if (deltaI != 0 || deltaJ != 0) {
        if (i >= 0 && i < regions.length) {
          if (j >= 0 && j < regions[i].length) {
            touchingRegions.push(regions[i][j]);
          }
        }
      }
    }
  }
  return touchingRegions;
}

function getAdjacentRegions(region: ProtoRegion): ProtoRegion[] {
  const adjacentRegionsWithDups: ProtoRegion[] = [];

  if (region.code == 'TX') {
    for (const regionRow of regions) {
      for (const testRegion of regionRow) {
        if (testRegion.code[0] != 'C') {
          adjacentRegionsWithDups.push(testRegion);
        }
      }
    }
    adjacentRegionsWithDups.push(mexico);
  } else if (region.code == 'US') {
    for (const regionRow of regions) {
      for (const testRegion of regionRow) {
        if (testRegion.code[0] == 'M') {
          adjacentRegionsWithDups.push(testRegion);
        }
      }
    }
    adjacentRegionsWithDups.push(mexico);
  } else if (region.code == 'MX') {
    for (const regionRow of regions) {
      for (const testRegion of regionRow) {
        if (testRegion.code[0] != 'M') {
          for (const adjacentToTest of getAdjacentRegions(testRegion)) {
            if (adjacentToTest.code[0] == 'M') {
              adjacentRegionsWithDups.push(testRegion);
            }
          }
        }
      }
    }
    adjacentRegionsWithDups.push(texas);
    adjacentRegionsWithDups.push(usa);
  } else {
    const indexPairs = getRegionIndexPairs(region);
    for (const indexPair of indexPairs) {
      const touchingRegions = getTouchingRegions(indexPair[0], indexPair[1], false);
      for (const touchingRegion of touchingRegions) {
        if (touchingRegion != region) {
          adjacentRegionsWithDups.push(touchingRegion);
          if (touchingRegion.code[0] == 'M' && region.code[0] != 'M') {
            adjacentRegionsWithDups.push(mexico);
          }
        }
      }
    }
    if (['LA', 'NM'].includes(region.code)) {
      adjacentRegionsWithDups.push(texas);
    } else if (region.code[0] == 'M') {
      // municipality of mexico
      adjacentRegionsWithDups.push(texas);
      adjacentRegionsWithDups.push(usa);
    }
  }

  return removeDupRegions(adjacentRegionsWithDups);
}

function getChildRegions(region: ProtoRegion): ProtoRegion[] {
  if (region.code[0] == 'C' || (region.code != 'MX' && region.code[0] == 'M')) {
    return [];
  }

  const childRegionsWithDups: ProtoRegion[] = [];
  for (const regionRow of regions) {
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
    childRegionsWithDups.push(texas);
  }
  return removeDupRegions(childRegionsWithDups);
}

function getParentRegions(region: ProtoRegion): ProtoRegion[] {
  if (['US', 'MX'].includes(region.code)) {
    return [];
  }
  if (region.code[0] == 'M') {
    return [mexico];
  }
  if (region.code[0] == 'C') {
    return [texas, usa];
  }
  return [usa];
}

abstract class RegionVisitor {
  visitorName: string;

  constructor(visitorName: string) {
    this.visitorName = visitorName;
  }

  async visitAroundRegion(aroundRegion: ProtoRegion) {
    if (aroundRegion.inDomain) {
      this._note('visiting all around in-domain region', aroundRegion);
      for (const nearRegion of this._getAllNearRegions(aroundRegion)) {
        await this._visitAroundDomainRegion(nearRegion);
        if (this._visitationRestriction(nearRegion)) {
          await this._visitAdjacentPendingRegion(nearRegion, aroundRegion);
          //await this._showState('after in-domain all', nearRegion, aroundRegion);
        }
      }
    } else {
      this._note('visiting adjacent around non-domain region', aroundRegion);
      for (const nearRegion of getAdjacentRegions(aroundRegion)) {
        if (nearRegion.inDomain && this._visitationRestriction(nearRegion)) {
          await this._visitAroundNonDomainRegion(nearRegion, aroundRegion);
          //await this._showState('after non-domain adjacent', nearRegion, aroundRegion);
        }
      }
      if (overDomain.includes(aroundRegion)) {
        this._note('visiting children of non-domain region', aroundRegion);
        for (const childRegion of getChildRegions(aroundRegion)) {
          if (childRegion.inDomain && this._visitationRestriction(childRegion)) {
            await this._visitAroundNonDomainRegion(childRegion, aroundRegion);
            //await this._showState('after non-domain child', childRegion, aroundRegion);
          }
        }
      }
    }
  }

  abstract _visitationRestriction(nearRegion: ProtoRegion): boolean;

  _visitAroundDomainRegion(_nearRegion: ProtoRegion): Promise<void> {
    // do nothing by default
    return Promise.resolve();
  }

  abstract _visitAdjacentPendingRegion(
    nearRegion: ProtoRegion,
    aroundRegion: ProtoRegion
  ): Promise<void>;

  async _visitAroundNonDomainRegion(
    nearRegion: ProtoRegion,
    aroundRegion: ProtoRegion
  ): Promise<void> {
    await this._visitAdjacentPendingRegion(nearRegion, aroundRegion);
  }

  _getAllNearRegions(aroundRegion: ProtoRegion): ProtoRegion[] {
    // TODO: Experiment with whether it's more efficient to process
    // parent or child regions first.
    let regions = getAdjacentRegions(aroundRegion);
    regions = regions.concat(getParentRegions(aroundRegion));
    return regions.concat(getChildRegions(aroundRegion));
  }

  _note(message: string, region: ProtoRegion) {
    console.log(`${this.visitorName} - ${message} (${region.code})...\n`);
  }

  async _showState(
    context: string,
    forRegion: ProtoRegion,
    aroundRegion?: ProtoRegion
  ) {
    const aroundText = aroundRegion ? `around ${aroundRegion.code}: ` : '';
    await showState(
      `${this.visitorName} - ${context} (${aroundText}${forRegion.code})`
    );
  }
}

class CacheSingleRegionVisitor extends RegionVisitor {
  _visitationRestriction(nearRegion: ProtoRegion) {
    return nearRegion.status == RegionStatus.Pending;
  }

  async _visitAroundDomainRegion(nearRegion: ProtoRegion) {
    if (!regionRoster.includes(nearRegion)) {
      regionRoster.push(nearRegion);
    }
  }

  async _visitAdjacentPendingRegion(
    nearRegion: ProtoRegion,
    aroundRegion: ProtoRegion
  ) {
    aroundRegion.adjacentUncachedCount += nearRegion.localityTotal;
    await this._showState('read adjacent pending region', nearRegion, aroundRegion);
  }
}
const cacheSingleRegionVisitor = new CacheSingleRegionVisitor('cache single');

class PendingNearDomainRegionVisitor extends RegionVisitor {
  _visitationRestriction(nearRegion: ProtoRegion) {
    return nearRegion.status == RegionStatus.Cached;
  }

  async _visitAdjacentPendingRegion(
    nearRegion: ProtoRegion,
    aroundRegion: ProtoRegion
  ) {
    nearRegion.adjacentUncachedCount -= aroundRegion.localityTotal;
    await this._showState('read around region', nearRegion, aroundRegion);
  }
}
const pendingNearDomainRegionVisitor = new PendingNearDomainRegionVisitor(
  'prep to remove'
);

class CacheAroundRegionVisitor extends RegionVisitor {
  _visitationRestriction(nearRegion: ProtoRegion) {
    return nearRegion.status == RegionStatus.Pending;
  }

  async _visitAdjacentPendingRegion(
    nearRegion: ProtoRegion,
    _aroundRegion: ProtoRegion
  ) {
    await cacheRegion(nearRegion);
    await pendingNearDomainRegionVisitor.visitAroundRegion(nearRegion);
  }

  async _visitAroundNonDomainRegion(
    nearRegion: ProtoRegion,
    _aroundRegion: ProtoRegion
  ): Promise<void> {
    await cacheRegion(nearRegion);
    for (const aroundNearRegion of this._getAllNearRegions(nearRegion)) {
      if (aroundNearRegion.status == RegionStatus.Cached) {
        aroundNearRegion.adjacentUncachedCount -= nearRegion.localityTotal;
        await this._showState('read around near region', aroundNearRegion, nearRegion);
      }
    }
  }
}
const cacheAroundRegionVisitor = new CacheAroundRegionVisitor('cache around');

async function cacheRegion(regionToCache: ProtoRegion) {
  if (cachedLocalities.includes(regionToCache)) {
    throw Error(`Already cached region ${regionToCache.code}`);
  }
  cachedLocalities.push(regionToCache);
  regionToCache.status = RegionStatus.Cached;
  await cacheSingleRegionVisitor.visitAroundRegion(regionToCache);
}

//   // abstract the remainder of the function
//   if (regionToCache.inDomain) {
//     let regions = getAdjacentRegions(regionToCache);
//     regions = regions.concat(getParentRegions(regionToCache));
//     regions = regions.concat(getChildRegions(regionToCache));
//     for (const region of regions) {
//       // provide the following block as param X
//       if (!regionRoster.includes(region)) {
//         regionRoster.push(region);
//       }
//       if (region.status == RegionStatus.Pending) {
//         // provide the contents of this block as param Y
//         regionToCache.adjacentUncachedCount += region.localityTotal;
//       }
//     }
//   } else {
//     for (const region of getAdjacentRegions(regionToCache)) {
//       // provide the 2nd of these conditions as param A
//       if (region.inDomain && region.status == RegionStatus.Pending) {
//         // provide the contents of this block as param Z
//         regionToCache.adjacentUncachedCount += region.localityTotal;
//       }
//     }
//     if (overDomain.includes(regionToCache)) {
//       for (const region of getChildRegions(regionToCache)) {
//         // provide the 2nd of these conditions as param A
//         if (region.inDomain && region.status == RegionStatus.Pending) {
//           // provide the contents of this block as param Z
//           regionToCache.adjacentUncachedCount += region.localityTotal;
//         }
//       }
//     }
//   }
// }

function processRegion(region: ProtoRegion) {
  region.processed = true;
}

function removeRegion(fromList: ProtoRegion[], region: ProtoRegion) {
  const newList: ProtoRegion[] = [];
  for (const listedRegion of fromList) {
    if (listedRegion !== region) {
      newList.push(listedRegion);
    }
  }
  return newList;
}

async function run() {
  // Initialize

  console.log('\n*** RESTARTING ***\n');
  regions = makeRegionMatrix(regionData);
  for (const regionRow of regions) {
    for (const region of regionRow) {
      if (region.inDomain) {
        regionRoster.push(region);
      }
    }
  }
  regionRoster.push(texas);
  await showState('After initialization');

  let region: ProtoRegion | null = regions[1][1];
  await cacheRegion(region);
  let sequence = 0;

  // Loop
  while (region != null) {
    region.sequence = ++sequence;
    await showState('Top of loop');

    // Consolidate
    if (region.adjacentUncachedCount != 0) {
      await cacheAroundRegionVisitor.visitAroundRegion(region);
    }
    processRegion(region);
    // the following would actually be done per locality
    cachedLocalities = removeRegion(cachedLocalities, region);
    region.status = RegionStatus.Complete;

    // Select next region
    let lowestUncachedCount = Infinity;
    region = null;
    for (const prospect of regionRoster) {
      if (
        prospect.status == RegionStatus.Cached &&
        prospect.adjacentUncachedCount < lowestUncachedCount
      ) {
        lowestUncachedCount = prospect.adjacentUncachedCount;
        region = prospect;
      }
    }
  }
  await showState('Completed');
}

async function showState(point: string) {
  console.log(point + ':');
  console.log('  Region roster:', regionRoster.map((r) => r.code).join(', '));
  console.log(
    '  Cached localities(*):',
    cachedLocalities.map((r) => r.code).join(', ')
  );
  console.log();
  for (const regionRow of regions) {
    console.log('  ' + regionRow.map((column) => column.toState()).join(' | '));
  }
  console.log('\n  ' + [texas, usa, mexico].map((r) => r.toState()).join(' | '));
  console.log();
  if (point != 'Completed') {
    await inputKey();
  }
}

async function inputKey() {
  process.stdin.setRawMode(true);
  return new Promise((resolve: any) =>
    process.stdin.once('data', (data) => {
      process.stdin.setRawMode(false);
      //console.log('RECEIVED KEY', data[0]);
      resolve();
      if (data[0] != 32) {
        process.exit(0);
      }
    })
  );
}

(async () => {
  await run();
  process.exit(0);
})();
