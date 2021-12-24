/**
 * Tools for converting the Census Bureau text file specifying adjacent U.S.
 * counties into something software-readable and into a smaller binary file.
 * File found at https://www.census.gov/programs-surveys/geography/library/reference/county-adjacency-file.html
 */

// TODO: Round-tripping the census data to and from the storage format here
// results in mangled foreign characters.

import fs, { promises as fsp } from 'fs';
import readline from 'readline';

const BUFFER_CHUNK_SIZE = 2 ** 15;

export interface CountyAdjacency {
  countyID: number; // this ID is unique to the file; it's not a GeographyID
  countyName: string;
  stateAbbr: string;
  adjacentIDs: number[];
}

export class BinaryCountyAdjacencyFile {
  filePath: string; // path to binary file to read or write
  private _chunks: _BufferChunk[] = [];
  private _buf = Buffer.alloc(0); // minimize initial memory usage
  private _offset = 0;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async read(): Promise<CountyAdjacency[]> {
    const adjacencies: CountyAdjacency[] = [];
    this._buf = await fsp.readFile(this.filePath);
    let countyCount = this._getUInt16();
    while (countyCount-- > 0) {
      const countyID = this._getUInt16();
      const countyName = this._getText();
      const stateAbbr = this._getText();
      const adjacentIDs = this._getAdjacentIDs();
      adjacencies.push({ countyID, countyName, stateAbbr, adjacentIDs });
    }
    this._freeMemory();
    return adjacencies;
  }

  async write(adjacencies: CountyAdjacency[]) {
    this._buf = Buffer.alloc(BUFFER_CHUNK_SIZE);
    this._putUInt16(adjacencies.length);
    for (const adjacency of adjacencies) {
      this._putUInt16(adjacency.countyID);
      this._putText(adjacency.countyName);
      this._putText(adjacency.stateAbbr);
      for (const adjacentID of adjacency.adjacentIDs) {
        this._putUInt16(adjacentID);
      }
      this._putUInt16(0); // indicate end of list
    }
    if (this._offset !== 0) {
      this._chunks.push({
        buf: this._buf,
        endOffset: this._offset
      });
    }

    try {
      await fsp.truncate(this.filePath);
    } catch (err) {
      // ignore failure to truncate non-existant file
    }
    for (const chunk of this._chunks) {
      await fsp.writeFile(this.filePath, chunk.buf.slice(0, chunk.endOffset), {
        flag: 'a+'
      });
    }
    this._freeMemory();
  }

  private _getAdjacentIDs(): number[] {
    const adjacentIDs: number[] = [];
    let nextID = this._getUInt16();
    while (nextID !== 0) {
      adjacentIDs.push(nextID);
      nextID = this._getUInt16();
    }
    return adjacentIDs;
  }

  private _getText(): string {
    const length = this._getUInt16();
    this._offset += length;
    const text = this._buf.toString('utf8', this._offset - length, this._offset);
    return text;
  }

  private _getUInt16(): number {
    this._offset += 2;
    return this._buf.readUInt16LE(this._offset - 2);
  }

  private _putText(text: string) {
    const textByteLength = Buffer.byteLength(text, 'utf8');
    this._putUInt16(textByteLength);
    if (this._offset + textByteLength > BUFFER_CHUNK_SIZE) {
      this._pushBuffer();
    }
    this._buf.write(text, this._offset, textByteLength, 'utf8');
    this._offset += textByteLength;
  }

  private _putUInt16(uint: number) {
    if (this._offset + 2 > BUFFER_CHUNK_SIZE) {
      this._pushBuffer();
    }
    this._buf.writeUInt16LE(uint, this._offset);
    this._offset += 2;
  }

  private _pushBuffer() {
    this._chunks.push({
      buf: this._buf,
      endOffset: this._offset
    });
    this._buf = Buffer.alloc(BUFFER_CHUNK_SIZE);
    this._offset = 0;
  }

  private _freeMemory() {
    this._buf = Buffer.alloc(0);
    this._chunks = [];
  }
}

export class TextCountyAdjacencyFile {
  filePath: string; // path to text file to read
  private _adjacencies: CountyAdjacency[] = [];
  private _codesToIDs: Record<number, number> = {};
  private _currentCountyCode?: number;
  private _nextID = 1; // 0 means end of adjacency list
  private _currentCountyID?: number;
  private _currentCountyName?: string;
  private _currentStateAbbr?: string;
  private _currentAdjacentIDs: number[] = [];

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async read(): Promise<CountyAdjacency[]> {
    // The async version of readline isn't LTS as of this writing.
    return new Promise<CountyAdjacency[]>((resolve) => {
      const lineReader = readline.createInterface({
        input: fs.createReadStream(this.filePath, { encoding: 'utf8' }),
        crlfDelay: Infinity
      });
      lineReader.on('line', (line) => this._parseLine(line));
      lineReader.on('close', () => {
        this._addCounty();
        this._convertCodesToIDs();
        resolve(this._adjacencies);
      });
    });
  }

  write(adjacencies: CountyAdjacency[]) {
    // This method only exists for verifying the conversion. Note that it
    // converts back with different county codes, so the codes have to be
    // regex'd out before doing a text file comparison.

    const idToCountyAdjacency: Record<number, CountyAdjacency> = {};

    for (const adjacency of adjacencies) {
      idToCountyAdjacency[adjacency.countyID] = adjacency;
    }

    return new Promise<void>((resolve, reject) => {
      const stream = fs.createWriteStream(this.filePath, {
        flags: 'w',
        encoding: 'utf8'
      });
      stream.on('finish', () => resolve());
      stream.on('error', reject);

      for (const adjacency of adjacencies) {
        this._writeCountyColumns(stream, adjacency);
        let firstAdjacentID = true;

        // Add the county to its own adjacencies, in alphabetic order,
        // for purposes of comparing resulting text to the original.
        const outputAdjacentIDs = adjacency.adjacentIDs.slice();
        outputAdjacentIDs.push(adjacency.countyID);
        outputAdjacentIDs.sort((id1, id2) => {
          const adjacency1 = idToCountyAdjacency[id1];
          const adjacency2 = idToCountyAdjacency[id2];
          if (adjacency1.stateAbbr < adjacency2.stateAbbr) return -1;
          if (adjacency1.stateAbbr > adjacency2.stateAbbr) return 1;
          return adjacency1.countyName < adjacency2.countyName ? -1 : 1;
        });

        for (const adjacentID of outputAdjacentIDs) {
          if (firstAdjacentID) {
            firstAdjacentID = false;
            stream.write('\t');
          } else {
            stream.write('\t\t');
          }
          const adjacentCountyAdjacency = idToCountyAdjacency[adjacentID];
          this._writeCountyColumns(stream, adjacentCountyAdjacency);
          stream.write('\n');
        }
      }
      stream.end();
    });
  }

  private _parseLine(line: string) {
    const columns = line.split('\t');
    const firstColumn = columns[0];
    if (firstColumn) {
      if (this._currentCountyID) {
        this._addCounty();
      }
      const commaOffset = firstColumn.indexOf(',');
      this._currentCountyName = firstColumn.substring(1, commaOffset);
      this._currentStateAbbr = firstColumn.substr(commaOffset + 2, 2);
      this._currentCountyCode = parseInt(columns[1]);
      this._currentCountyID = this._nextID;
      this._codesToIDs[this._currentCountyCode] = this._nextID;
      this._currentAdjacentIDs = [];
      this._nextID += 1;
    }
    const adjacentCountyCode = parseInt(columns[3]);
    if (adjacentCountyCode != this._currentCountyCode) {
      // Push census codes for now, will translate to IDs later.
      this._currentAdjacentIDs.push(adjacentCountyCode);
    }
  }

  private _addCounty() {
    this._adjacencies.push({
      countyID: this._currentCountyID!,
      countyName: this._currentCountyName!,
      stateAbbr: this._currentStateAbbr!,
      adjacentIDs: this._currentAdjacentIDs
    });
  }

  private _convertCodesToIDs() {
    for (const adjacency of this._adjacencies) {
      const adjacentIDs = adjacency.adjacentIDs;
      for (let i = 0; i < adjacentIDs.length; ++i) {
        const countyID = this._codesToIDs[adjacentIDs[i]];
        if (countyID) {
          adjacentIDs[i] = countyID;
        } else {
          // Some counties listed as adjacent don't have primary records.
          adjacency.adjacentIDs.splice(i, 1);
          i -= 1;
        }
      }
    }
  }

  private _writeCountyColumns(stream: fs.WriteStream, adjacency: CountyAdjacency) {
    stream.write(
      `"${adjacency.countyName}, ${adjacency.stateAbbr}"\t${adjacency.countyID}`
    );
  }
}

class _BufferChunk {
  buf: Buffer;
  endOffset: number;

  constructor(buf: Buffer, endOffset: number) {
    this.buf = buf;
    this.endOffset = endOffset;
  }
}
