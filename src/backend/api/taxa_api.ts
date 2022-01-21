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
    // runs ~20% faster with bundling
    try {
      return bundleTaxa(
        await query.getUnusedTaxa(
          this._kernel.database,
          oldestDate,
          newestDate,
          lowestBoundTaxonID,
          TAXON_BATCH_SIZE
        )
      );
    } catch (err: any) {
      throw new RelayedError(err);
    }
  }
}

function bundleTaxa(taxa: Taxon[]): string {
  const values: string[] = [];
  for (const taxon of taxa) {
    values.push(taxon.TaxonID.toString());
    values.push(taxon.Name);
    values.push(taxon.RankID.toString());
    values.push(taxon.ParentID !== null ? taxon.ParentID.toString() : '');
    values.push(
      taxon.CreatedByAgentID !== null ? taxon.CreatedByAgentID.toString() : ''
    );
    values.push(
      taxon.TimestampCreated !== null ? taxon.TimestampCreated.toString() : ''
    );
  }
  return values.join('|');
}
