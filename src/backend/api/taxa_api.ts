import { RelayedError } from 'electron-ipc-methods';

import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';

const TAXON_BATCH_SIZE = 5000;

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
