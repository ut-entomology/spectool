import { RelayedError } from 'electron-ipc-methods';

import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';

const TAXON_BATCH_SIZE = 10000;

export type Taxon = ReturnType<typeof query.getUnusedTaxa> extends Promise<infer R>
  ? R extends (infer T)[]
    ? T
    : never
  : never;

export class TaxaApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getBatchOfUnusedTaxa(
    oldestDate: Date,
    newestDate: Date,
    lowestBoundTaxonID: number
  ) {
    try {
      return await query.getUnusedTaxa(
        this._kernel.database,
        oldestDate,
        newestDate,
        lowestBoundTaxonID,
        TAXON_BATCH_SIZE
      );
    } catch (err: any) {
      throw new RelayedError(err);
    }
  }
}

const _TAXON_FIELD_COUNT = 6;

export function bundleTaxa(taxa: Taxon[]): string {
  const values: string[] = [];
  for (const taxon of taxa) {
    values.push(taxon.TaxonID.toString());
    values.push(taxon.Name);
    values.push(taxon.RankID.toString());
    values.push(taxon.ParentID.toString());
    values.push(taxon.CreatedByAgentID.toString());
    values.push(taxon.TimestampCreated.toString());
  }
  return values.join('|');
}

export function unbundleTaxa(bundle: string): Taxon[] {
  const values = bundle.split('|');
  const taxa: Taxon[] = [];
  let i = 0;
  while (i < values.length) {
    let taxon: any = {};
    taxon.TaxonID = parseInt(values[i]);
    taxon.Name = values[i + 1];
    taxon.RankID = parseInt(values[i + 2]);
    taxon.ParentID = parseInt(values[i + 3]);
    taxon.CreatedByAgentID = parseInt(values[i + 4]);
    taxon.TimestampCreated = new Date(values[i + 5]);
    taxa.push(taxon);
    i += _TAXON_FIELD_COUNT;
  }
  return taxa;
}
