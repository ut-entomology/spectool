import { RelayedError } from 'electron-ipc-methods';

import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';

const TAXON_BATCH_SIZE = 10000;

export type Taxon = query.RowType<typeof query.getUnusedTaxa>;
export type TaxonomicRank = query.RowType<typeof query.getTaxonomicRanks>;

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

  async getTaxonomicRanks() {
    const ranks = await query.getTaxonomicRanks(this._kernel.database);
    const ranksMap: Record<number, TaxonomicRank> = {};
    for (const rank of ranks) {
      ranksMap[rank.RankID] = rank;
    }
    return ranksMap;
  }
}

function bundleTaxa(taxa: Taxon[]): string {
  const values: string[] = [];
  for (const taxon of taxa) {
    values.push(taxon.TaxonID.toString());
    values.push(taxon.FullName);
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
