"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var regions = [];
var regionRoster = [];
var cachedLocalities = [];
// 'a' prefix means it's adjacen, not in the domain
// 'c-' prefix means county or municipality
// 's-' prefix means state
// 'y-' prefix means country
// Capital letter sequence designates a region
// dash-number indicates the number of localities in the region
// < indicates that the region to the left extends to this point
// ^ indicates that the region above extends to this point
var regionData = "\n  as-MA-1|<     |<     |as-MB-1\n  c-CA-1 |c-CB-1|c-CC-1|c-CD-1 |as-NM-1\n  c-CE-1 |c-CF-1|c-CG-1|c-CH-1 |^\n  c-CI-1 |c-CJ-1|c-CK-1|c-CL-1 |as-LA-1\n";
var RegionStatus;
(function (RegionStatus) {
    RegionStatus[RegionStatus["Pending"] = 0] = "Pending";
    RegionStatus[RegionStatus["Cached"] = 1] = "Cached";
    RegionStatus[RegionStatus["Complete"] = 2] = "Complete";
})(RegionStatus || (RegionStatus = {}));
var ProtoRegion = /** @class */ (function () {
    function ProtoRegion(code, rank, inDomain, localityTotal) {
        this.status = RegionStatus.Pending;
        this.adjacentUncachedCount = 0;
        this.sequence = 0;
        this.processed = false;
        this.code = code;
        this.rank = rank;
        this.inDomain = inDomain;
        this.localityTotal = localityTotal;
    }
    ProtoRegion.prototype.toState = function () {
        var s = this.status == RegionStatus.Cached ? '*' : '';
        s += this.code + ":" + this.adjacentUncachedCount;
        if (this.sequence > 0) {
            s = "(" + this.sequence + ")" + s;
        }
        if (this.processed && this.status == RegionStatus.Complete) {
            s = '✓' + s;
        }
        return s.padEnd(10, ' ');
    };
    ProtoRegion.prototype.toString = function () {
        var rankToAbbrev = {
            county: 'c',
            state: 's',
            country: 'y'
        };
        return "" + (this.inDomain ? '' : 'a') + rankToAbbrev[this.rank] + "-" + this.code + "-" + this.localityTotal;
    };
    return ProtoRegion;
}());
var usa = new ProtoRegion('US', 'y', false, 1);
var texas = new ProtoRegion('TX', 's', true, 1);
var mexico = new ProtoRegion('MX', 'y', false, 1);
function makeRegionMatrix(regionData) {
    var rows = regionData.split('\n');
    var rowIndex = 0;
    for (var _i = 0, rows_1 = rows; _i < rows_1.length; _i++) {
        var row = rows_1[_i];
        if (row.trim() == '') {
            continue;
        }
        var regionRow = [];
        var columnIndex = 0;
        var columns = row.split('|');
        for (var _a = 0, columns_1 = columns; _a < columns_1.length; _a++) {
            var column = columns_1[_a];
            var code = void 0;
            var rank = void 0;
            var inDomain = true;
            var localityTotal = void 0;
            var units = column.trim().split('-');
            if (units[0] == '<') {
                regionRow.push(regionRow[columnIndex - 1]);
            }
            else if (units[0] == '^') {
                regionRow.push(regions[rowIndex - 1][columnIndex]);
            }
            else {
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
                        throw Error("Unrecognized rank '" + units[0][0] + "' in column '" + column + "'");
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
function getRegionIndexPairs(region) {
    var indexPairs = [];
    for (var i = 0; i < regions.length; ++i) {
        var regionRow = regions[i];
        for (var j = 0; j < regionRow.length; ++j) {
            if (regions[i][j] === region) {
                indexPairs.push([i, j]);
            }
        }
    }
    return indexPairs;
}
function getTouchingRegions(rowIndex, columnIndex, withCornerTouching) {
    var touchingRegions = [];
    for (var deltaI = -1; deltaI <= 1; ++deltaI) {
        for (var deltaJ = -1; deltaJ <= 1; ++deltaJ) {
            var i = rowIndex + deltaI;
            var j = columnIndex + deltaJ;
            if (!withCornerTouching && deltaI != 0 && deltaJ != 0) {
                continue;
            }
            if (deltaI != 0 || deltaJ != 0) {
                if (i >= 0 && i < regions.length) {
                    if (j >= 0 && j < regions[i].length) {
                        var region = regions[i][j];
                        if (region.code[0] == 'M') {
                            touchingRegions.push(mexico);
                        }
                        else if (region.code[0] == 'C') {
                            touchingRegions.push(texas);
                            touchingRegions.push(usa);
                        }
                        else if (['NM', 'LA'].includes(region.code)) {
                            touchingRegions.push(usa);
                        }
                        touchingRegions.push(region);
                    }
                }
            }
        }
    }
    return touchingRegions;
}
function getAdjacentRegions(region) {
    var adjacentRegions = [];
    if (region.code == 'NM') {
        adjacentRegions.push(mexico);
    }
    if (['NM', 'LA'].includes(region.code)) {
        adjacentRegions.push(texas);
        adjacentRegions.push(usa);
    }
    else if (['US', 'TX'].includes(region.code)) {
        if (region.code == 'US') {
            adjacentRegions.push(texas);
        }
        else {
            adjacentRegions.push(usa);
        }
        adjacentRegions.push(mexico);
        for (var _i = 0, regions_1 = regions; _i < regions_1.length; _i++) {
            var regionRow = regions_1[_i];
            for (var _a = 0, regionRow_1 = regionRow; _a < regionRow_1.length; _a++) {
                var touchingRegion = regionRow_1[_a];
                if (!adjacentRegions.includes(touchingRegion)) {
                    adjacentRegions.push(touchingRegion);
                }
            }
        }
        return adjacentRegions;
    }
    else if (region.code == 'MX') {
        adjacentRegions.push(texas);
        adjacentRegions.push(usa);
        for (var _b = 0, regions_2 = regions; _b < regions_2.length; _b++) {
            var regionRow = regions_2[_b];
            for (var _c = 0, regionRow_2 = regionRow; _c < regionRow_2.length; _c++) {
                var testRegion = regionRow_2[_c];
                if (testRegion.code[0] == 'M') {
                    if (!adjacentRegions.includes(testRegion)) {
                        adjacentRegions.push(testRegion);
                    }
                    for (var _d = 0, _e = getAdjacentRegions(testRegion); _d < _e.length; _d++) {
                        var adjacentRegion = _e[_d];
                        if (adjacentRegion != mexico) {
                            if (!adjacentRegions.includes(adjacentRegion)) {
                                adjacentRegions.push(adjacentRegion);
                            }
                        }
                    }
                }
            }
        }
        return adjacentRegions;
    }
    var indexPairs = getRegionIndexPairs(region);
    // console.log(
    //   `index pairs for ${region.code}:`,
    //   indexPairs.map((p) => `(${p[0]},${p[1]})`).join(', ')
    // );
    for (var _f = 0, indexPairs_1 = indexPairs; _f < indexPairs_1.length; _f++) {
        var indexPair = indexPairs_1[_f];
        var touchingRegions = getTouchingRegions(indexPair[0], indexPair[1], false);
        // console.log(
        //   `touching ${region.code}:`,
        //   touchingRegions.map((r) => r.code).join(', ')
        // );
        for (var _g = 0, touchingRegions_1 = touchingRegions; _g < touchingRegions_1.length; _g++) {
            var touchingRegion = touchingRegions_1[_g];
            if (!adjacentRegions.includes(touchingRegion)) {
                adjacentRegions.push(touchingRegion);
            }
        }
        // console.log('adjacentRegions', adjacentRegions);
    }
    return adjacentRegions;
}
function cacheRegion(region) {
    if (cachedLocalities.includes(region)) {
        throw Error("Already cached region " + region.code);
    }
    cachedLocalities.push(region);
    region.status = RegionStatus.Cached;
    for (var _i = 0, _a = getAdjacentRegions(region); _i < _a.length; _i++) {
        var adjacentRegion = _a[_i];
        if (region.inDomain) {
            if (!regionRoster.includes(adjacentRegion)) {
                regionRoster.push(adjacentRegion);
            }
            if (adjacentRegion.status == RegionStatus.Pending) {
                region.adjacentUncachedCount += adjacentRegion.localityTotal;
            }
        }
        else if (adjacentRegion.inDomain) {
            if (adjacentRegion.status == RegionStatus.Pending) {
                region.adjacentUncachedCount += adjacentRegion.localityTotal;
            }
        }
    }
}
function processRegion(region) {
    region.processed = true;
}
function removeRegion(fromList, region) {
    var newList = [];
    for (var _i = 0, fromList_1 = fromList; _i < fromList_1.length; _i++) {
        var listedRegion = fromList_1[_i];
        if (listedRegion !== region) {
            newList.push(listedRegion);
        }
    }
    return newList;
}
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, regions_3, regionRow, _a, regionRow_3, region_1, region, sequence, _b, _c, adjacentU, _d, _e, adjacentA, lowestUncachedCount, _f, regionRoster_1, prospect;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    // Initialize
                    console.log('*** RESTARTING ***');
                    regions = makeRegionMatrix(regionData);
                    regionRoster.push(texas);
                    for (_i = 0, regions_3 = regions; _i < regions_3.length; _i++) {
                        regionRow = regions_3[_i];
                        for (_a = 0, regionRow_3 = regionRow; _a < regionRow_3.length; _a++) {
                            region_1 = regionRow_3[_a];
                            if (region_1.inDomain) {
                                regionRoster.push(region_1);
                            }
                        }
                    }
                    return [4 /*yield*/, showState('After initialization')];
                case 1:
                    _g.sent();
                    region = regions[1][1];
                    cacheRegion(region);
                    sequence = 0;
                    _g.label = 2;
                case 2:
                    if (!(region != null)) return [3 /*break*/, 8];
                    region.sequence = ++sequence;
                    return [4 /*yield*/, showState('Start of loop')];
                case 3:
                    _g.sent();
                    if (!(region.adjacentUncachedCount != 0)) return [3 /*break*/, 7];
                    _b = 0, _c = getAdjacentRegions(region);
                    _g.label = 4;
                case 4:
                    if (!(_b < _c.length)) return [3 /*break*/, 7];
                    adjacentU = _c[_b];
                    if (!(region.inDomain || adjacentU.inDomain)) return [3 /*break*/, 6];
                    if (!(adjacentU.status == RegionStatus.Pending)) return [3 /*break*/, 6];
                    cacheRegion(adjacentU);
                    // console.log(
                    //   `Adjacent to ${adjacentU.code}:`,
                    //   getAdjacentRegions(adjacentU)
                    //     .map((r) => r.code)
                    //     .join(', ')
                    // );
                    for (_d = 0, _e = getAdjacentRegions(adjacentU); _d < _e.length; _d++) {
                        adjacentA = _e[_d];
                        if (adjacentA.status == RegionStatus.Cached) {
                            if (adjacentA.inDomain || adjacentU.inDomain) {
                                adjacentA.adjacentUncachedCount -= adjacentU.localityTotal;
                                //console.log(`**** ${adjacentA.code} -= ${adjacentU.code}`);
                            }
                        }
                    }
                    return [4 /*yield*/, showState("Cached adjacent region " + adjacentU.code)];
                case 5:
                    _g.sent();
                    _g.label = 6;
                case 6:
                    _b++;
                    return [3 /*break*/, 4];
                case 7:
                    processRegion(region);
                    cachedLocalities = removeRegion(cachedLocalities, region);
                    region.status = RegionStatus.Complete;
                    lowestUncachedCount = Infinity;
                    region = null;
                    for (_f = 0, regionRoster_1 = regionRoster; _f < regionRoster_1.length; _f++) {
                        prospect = regionRoster_1[_f];
                        if (prospect.status == RegionStatus.Cached &&
                            prospect.adjacentUncachedCount < lowestUncachedCount) {
                            lowestUncachedCount = prospect.adjacentUncachedCount;
                            region = prospect;
                        }
                    }
                    return [3 /*break*/, 2];
                case 8: return [4 /*yield*/, showState('Completion')];
                case 9:
                    _g.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function showState(point) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, regions_4, regionRow;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log(point + ':');
                    console.log('  Region roster:', regionRoster.map(function (r) { return r.code; }).join(', '));
                    console.log('  Cached localities(*):', cachedLocalities.map(function (r) { return r.code; }).join(', '));
                    console.log();
                    for (_i = 0, regions_4 = regions; _i < regions_4.length; _i++) {
                        regionRow = regions_4[_i];
                        console.log('  ' + regionRow.map(function (column) { return column.toState(); }).join(' | '));
                    }
                    console.log('\n  ' + [texas, usa, mexico].map(function (r) { return r.toState(); }).join(' | '));
                    console.log();
                    return [4 /*yield*/, inputKey()];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function inputKey() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            process.stdin.setRawMode(true);
            return [2 /*return*/, new Promise(function (resolve) {
                    return process.stdin.once('data', function (data) {
                        process.stdin.setRawMode(false);
                        resolve();
                        if (data[0] != 32) {
                            process.exit(0);
                        }
                    });
                })];
        });
    });
}
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, run()];
            case 1:
                _a.sent();
                process.exit(0);
                return [2 /*return*/];
        }
    });
}); })();
