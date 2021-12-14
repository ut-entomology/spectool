export {};

let regions: ProtoRegion[][] = [];
let pendingRegions: ProtoRegion[] = [];
let cachedLocalities: ProtoRegion[] = [];

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

class ProtoRegion {
  code: string;
  rank: string;
  inDomain: boolean;
  localityTotal: number;
  isCached = false;
  adjacentUncachedCount = 0;
  sequence = 0;

  constructor(code: string, rank: string, inDomain: boolean, localityTotal: number) {
    this.code = code;
    this.rank = rank;
    this.inDomain = inDomain;
    this.localityTotal = localityTotal;
  }

  toState(): string {
    let s = this.code;
    if (this.sequence > 0) {
      s = `(${this.sequence}) ${s}`;
    }
    if (this.isCached) {
      s += ':' + this.adjacentUncachedCount;
    } else if (this.adjacentUncachedCount > 0) {
      s += '*';
    }
    return s.padEnd(9, ' ');
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

const usa = new ProtoRegion('US', 'y', false, 1);
const texas = new ProtoRegion('TX', 's', true, 1);
const mexico = new ProtoRegion('MX', 'y', false, 1);

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

// verify region data
// const regions = makeRegionMatrix(regionData);
// for (const regionRow of regions) {
//   let rowStr = '';
//   for (const region of regionRow) {
//     rowStr += region.toString() + '|';
//   }
//   console.log(rowStr);
// }

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

function getTouchingRegions(rowIndex: number, columnIndex: number): ProtoRegion[] {
  const touchingRegions: ProtoRegion[] = [];
  for (let deltaI = -1; deltaI <= 1; ++deltaI) {
    for (let deltaJ = -1; deltaJ <= 1; ++deltaJ) {
      const i = rowIndex + deltaI;
      const j = columnIndex + deltaJ;
      if (i != 0 || j != 0) {
        if (i >= 0 && i < regions.length) {
          if (j >= 0 && j < regions[i].length) {
            const region = regions[i][j];
            if (region.code[0] == 'M') {
              touchingRegions.push(mexico!);
            } else if (region.code[0] == 'C') {
              touchingRegions.push(texas!);
              touchingRegions.push(usa!);
            } else if (['NM', 'LA'].includes(region.code)) {
              touchingRegions.push(usa!);
            }
            touchingRegions.push(region);
          }
        }
      }
    }
  }
  return touchingRegions;
}

function getAdjacentRegions(region: ProtoRegion): ProtoRegion[] {
  if (['US', 'MX'].includes(region.code)) {
    throw Error(`Requested regions adjacent to ${region.code}`);
  }
  const adjacentRegions: ProtoRegion[] = [];
  if (region.code == 'TX') {
    adjacentRegions.push(usa);
    adjacentRegions.push(mexico);
    for (const regionRow of regions) {
      for (const touchingRegion of regionRow) {
        if (!adjacentRegions.includes(touchingRegion)) {
          adjacentRegions.push(touchingRegion);
        }
      }
    }
    return adjacentRegions;
  }
  const indexPairs = getRegionIndexPairs(region);
  for (const indexPair of indexPairs) {
    // console.log('indexPair', indexPair);
    const touchingRegions = getTouchingRegions(indexPair[0], indexPair[1]);
    // console.log('touchingRegions', touchingRegions);
    for (const touchingRegion of touchingRegions) {
      if (!adjacentRegions.includes(touchingRegion)) {
        adjacentRegions.push(touchingRegion);
      }
    }
    // console.log('adjacentRegions', adjacentRegions);
  }
  return adjacentRegions;
}

function cacheRegion(region: ProtoRegion) {
  if (cachedLocalities.includes(region)) {
    throw Error(`Already cached region ${region.code}`);
  }
  cachedLocalities.push(region);
  region.isCached = true;
  for (const adjacentRegion of getAdjacentRegions(region)) {
    if (region.inDomain) {
      if (!pendingRegions.includes(adjacentRegion)) {
        pendingRegions.push(adjacentRegion);
      }
      if (!adjacentRegion.isCached) {
        region.adjacentUncachedCount += adjacentRegion.localityTotal;
      }
    } else if (adjacentRegion.inDomain) {
      if (!adjacentRegion.isCached) {
        region.adjacentUncachedCount += adjacentRegion.localityTotal;
      }
    }
  }
}

function processRegion(_region: ProtoRegion) {}

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

  console.log('*** RESTARTING ***');
  regions = makeRegionMatrix(regionData);
  pendingRegions.push(texas);
  for (const regionRow of regions) {
    for (const region of regionRow) {
      if (region.inDomain) {
        pendingRegions.push(region);
      }
    }
  }
  showState('After initialization');
  await inputKey();

  let region = regions[1][1];
  cacheRegion(region);
  let sequence = 1;
  region.sequence = sequence;

  // Loop
  while (true) {
    showState('Start of loop');
    await inputKey();

    // Consolidate
    if (region.adjacentUncachedCount != 0) {
      for (const adjacentU of getAdjacentRegions(region)) {
        if (region.inDomain || adjacentU.inDomain) {
          if (!adjacentU.isCached) {
            cacheRegion(adjacentU);
            showState(`Cached adjacent region ${adjacentU.code}`);
            for (const adjacentA of getAdjacentRegions(adjacentU)) {
              if (adjacentA.inDomain || adjacentU.inDomain) {
                adjacentA.adjacentUncachedCount -= adjacentU.localityTotal;
              }
            }
          }
        }
      }
      processRegion(region);
      cachedLocalities = removeRegion(cachedLocalities, region);
      pendingRegions = removeRegion(pendingRegions, region);

      // Select next region
      if (pendingRegions.length == 0) {
        break;
      }
      let lowestUncachedCount = Infinity;
      let nextRegion: ProtoRegion | null = null;
      for (const prospect of pendingRegions) {
        if (prospect.adjacentUncachedCount < lowestUncachedCount) {
          lowestUncachedCount = prospect.adjacentUncachedCount;
          nextRegion = prospect;
        }
      }
      region = nextRegion!;
    }
    sequence += 1;
  }
  showState('Completion');
}

function showState(point: string) {
  console.log(point + ':');
  console.log('  Pending regions: ', pendingRegions.map((r) => r.code).join(', '));
  console.log('  Cached localities: ', cachedLocalities.map((r) => r.code).join(', '));
  console.log();
  for (const regionRow of regions) {
    console.log('  ' + regionRow.map((column) => column.toState()).join(' | '));
  }
  console.log();
}

async function inputKey() {
  process.stdin.setRawMode(true);
  return new Promise((resolve: any) =>
    process.stdin.once('data', (data) => {
      process.stdin.setRawMode(false);
      resolve();
      if (data[0] != 32) {
        process.exit(0);
      }
    })
  );
}

(async () => {
  await run();
})();
