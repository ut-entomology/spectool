import { promises as fsp } from 'fs';

const BUFFER_CHUNK_SIZE = 32768;

export interface CountyAdjacency {
  countyID: number;
  countyName: string;
  state: string;
  adjacentCountyIDs: number[];
}

class _BufferChunk {
  buf: Buffer;
  endOffset: number;

  constructor(buf: Buffer, endOffset: number) {
    this.buf = buf;
    this.endOffset = endOffset;
  }
}

export class BinaryCountyAdjacencyFile {
  filePath: string; // path to binary file to read or write
  private _chunks: _BufferChunk[] = [];
  private _buf = Buffer.alloc(BUFFER_CHUNK_SIZE);
  private _offset = 0;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  read(): CountyAdjacency[] {}

  async write(adjacencies: CountyAdjacency[]) {
    this._putUInt16(adjacencies.length);
    for (const adjacency of adjacencies) {
      this._putUInt16(adjacency.countyID);
      this._putString(adjacency.countyName);
      this._putString(adjacency.state);
      for (const adjacentID of adjacency.adjacentCountyIDs) {
        if (adjacentID != adjacency.countyID) {
          this._putUInt16(adjacentID);
        }
      }
      this._putUInt16(0); // indicate end of list
    }

    for (const chunk of this._chunks) {
      await fsp.writeFile(this.filePath, chunk.buf.slice(0, chunk.endOffset), {
        flag: 'a'
      });
    }
  }

  private _putString(text: string) {
    const textByteLength = Buffer.byteLength(text);
    if (this._offset + 2 + textByteLength > BUFFER_CHUNK_SIZE) {
      this._pushBuffer();
    }
    this._buf.writeUInt16LE(textByteLength, this._offset);
    this._buf.write(text, this._offset + 2);
    this._offset += 2 + textByteLength;
  }

  private _putUInt16(id: number) {
    if (this._offset + 2 > BUFFER_CHUNK_SIZE) {
      this._pushBuffer();
    }
    this._buf.writeUInt16LE(id);
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
}

export class TextCountyAdjacencyFile {
  filePath: string; // path to text file to read
  private _codesToIDs: Record<number, number> = {};
  private _nextID = 1; // 0 means end of adjacency list

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  read(): CountyAdjacency[] {
    //this._codesToIDs[adjacentCode]
  }
}
