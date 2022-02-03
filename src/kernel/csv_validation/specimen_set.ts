import * as fs from 'fs';
import * as fsp from 'fs/promises';
import * as path from 'path';
import { parse as parseCSV } from '@fast-csv/parse';

import type { AppKernel } from '../../kernel/app_kernel';
import { Specimen, HEADER_REGEX } from './specimen';

const DEFAULT_HEADER_JSON_DIR = '../../../public/data';
const HEADER_JSON_FILE_NAME = 'csv-headers.json';

type HeaderDef = {
  synonyms: string[];
  maxNumber: number;
  normalizedSynonyms?: string[];
};
type HeaderDefs = Record<string, HeaderDef>;

let specimenSet: SpecimenSet | null;

export async function getHeaderJSONPath(kernel: AppKernel) {
  const defaultHeaderJSONPath = path.join(
    __dirname,
    DEFAULT_HEADER_JSON_DIR,
    HEADER_JSON_FILE_NAME
  );
  const dataFolderHeaderJSONPath = path.join(
    kernel.appPrefs.dataFolder,
    HEADER_JSON_FILE_NAME
  );
  try {
    // Fails to copy if destination already exists.
    await fsp.copyFile(
      defaultHeaderJSONPath,
      dataFolderHeaderJSONPath,
      fs.constants.COPYFILE_EXCL
    );
  } catch (err) {
    // ignore failure to copy, as destination likely already exists
  }
  // Make sure we can access the file.
  await fsp.access(dataFolderHeaderJSONPath);
  return dataFolderHeaderJSONPath;
}

export async function openSpecimenSet(csvFilePath: string, headerJSONPath: string) {
  specimenSet = new SpecimenSet(csvFilePath, headerJSONPath);
  await specimenSet.load();
}

export function getSpecimenSet() {
  return specimenSet;
}

export function closeSpecimenSet() {
  specimenSet = null;
}

export class SpecimenSet {
  csvFilePath: string;
  headerJSONPath: string;
  rawHeaderMap: Record<string, string> = {}; // maps standard headers to raw headers
  unrecognizedHeaders: string[] = [];
  specimens: Specimen[] = [];

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
          .on('data', (row) => this.specimens.push(new Specimen(row)))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });
    });
  }

  _transformHeaders(
    headerDefs: HeaderDefs,
    rawHeaders: (string | null | undefined)[]
  ): string[] {
    const headers: string[] = [];
    for (const rawHeader of rawHeaders) {
      if (rawHeader) {
        const standardHeader = this._transformHeader(headerDefs, rawHeader);
        headers.push(standardHeader);
        this.rawHeaderMap[standardHeader] = rawHeader;
      } else if (rawHeader == '') {
        headers.push('(blank)');
      } else if (rawHeader == null) {
        headers.push('(null)');
      } else {
        headers.push('(undefined)');
      }
    }
    return headers;
  }

  _transformHeader(headerDefs: HeaderDefs, rawHeader: string): string {
    rawHeader = rawHeader.trim();
    const matches = rawHeader.match(HEADER_REGEX);
    if (matches) {
      const normalizedHeader = this._normalizeHeader(matches[1]);
      const columnNumber = matches[2] ? parseInt(matches[2]) : 0;

      for (const [standardHeader, def] of Object.entries(headerDefs)) {
        if (!def.normalizedSynonyms) {
          def.normalizedSynonyms = [];
          def.normalizedSynonyms.push(this._normalizeHeader(standardHeader));
          for (const synonym of def.synonyms) {
            def.normalizedSynonyms.push(this._normalizeHeader(synonym));
          }
        }
        if (
          columnNumber <= def.maxNumber &&
          def.normalizedSynonyms.includes(normalizedHeader)
        ) {
          if (def.maxNumber <= 1) {
            return standardHeader;
          }
          return standardHeader + (columnNumber == 0 ? 1 : columnNumber);
        }
      }
    }
    this.unrecognizedHeaders.push(rawHeader);
    return rawHeader;
  }

  _normalizeHeader(header: string) {
    return header.replace(/[-_. ]/g, '').toLowerCase();
  }
}
