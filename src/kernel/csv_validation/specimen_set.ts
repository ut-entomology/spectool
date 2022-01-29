import * as fs from 'fs';
import * as fsp from 'fs/promises';
import { parse as parseCSV } from '@fast-csv/parse';

import { SpecimenRow } from './specimen_row';

// TODO: I'm not pushing the right row columns yet. Need trailing numbers.

type HeaderDef = {
  synonyms: string[];
  maxNumber: number;
  normalizedSynonyms?: string[];
};
type HeaderDefs = Record<string, HeaderDef>;

export class SpecimenSet {
  csvFilePath: string;
  headerJSONPath: string;
  rawHeaders: string[] = [];
  rows: SpecimenRow[] = [];

  constructor(csvFilePath: string, headerJSONPath: string) {
    this.csvFilePath = csvFilePath;
    this.headerJSONPath = headerJSONPath;
  }

  async load() {
    fsp.readFile(this.headerJSONPath, 'utf8').then((json) => {
      const headerDefs = JSON.parse(json);
      return new Promise<void>((resolve, reject) => {
        fs.createReadStream(this.csvFilePath)
          .pipe(parseCSV({ headers: this._transformHeaders.bind(this, headerDefs) }))
          .on('data', (row) => this.rows.push(row))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });
    });
  }

  _transformHeaders(
    headerDefs: HeaderDefs,
    rawHeaders: (string | null | undefined)[]
  ): string[] {
    this.rawHeaders = rawHeaders as any;
    const headers: string[] = [];
    for (const rawHeader of rawHeaders) {
      if (!rawHeader) {
        throw Error('Non-string CSV header');
      }
      headers.push(this._transformHeader(headerDefs, rawHeader));
    }
    return headers;
  }

  _transformHeader(headerDefs: HeaderDefs, rawHeader: string): string {
    const normalizedHeader = this._normalizeHeader(rawHeader);
    for (const [property, def] of Object.entries(headerDefs)) {
      if (!def.normalizedSynonyms) {
        def.normalizedSynonyms = [];
        for (const synonym of def.synonyms) {
          def.normalizedSynonyms.push(this._normalizeHeader(synonym));
        }
      }
      if (def.normalizedSynonyms.includes(normalizedHeader)) {
        return property;
      }
    }
    throw Error(`CSV file column header '${rawHeader}' not recognized`);
  }

  _normalizeHeader(header: string) {
    return header.replace(/[-_. ]/, '').toLowerCase();
  }
}
