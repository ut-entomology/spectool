import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';
import { runQuery } from '../util/api_util';

const TAXON_BATCH_SIZE = 10000;

export type BaseTaxon = query.RowType<typeof query.getAncestorsOfUnusedTaxa>;
export type Taxon = query.RowType<typeof query.getUnusedTaxa>;
export type TaxonomicRank = query.RowType<typeof query.getTaxonomicRanks>;

export class TaxaApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getAncestorsOfUnusedTaxa(oldestDate: Date, newestDate: Date) {
    return runQuery(() =>
      query.getAncestorsOfUnusedTaxa(this._kernel.database, oldestDate, newestDate)
    );
  }

  async getBatchOfUnusedTaxa(
    oldestDate: Date,
    newestDate: Date,
    lowestBoundTaxonID: number
  ) {
    // runs ~20% faster with bundling
    const taxa = await runQuery(() =>
      query.getUnusedTaxa(
        this._kernel.database,
        oldestDate,
        newestDate,
        lowestBoundTaxonID,
        TAXON_BATCH_SIZE
      )
    );
    return _bundleTaxa(taxa);
  }

  async getOrdersAndHigher() {
    return runQuery(() => query.getOrdersAndHigher(this._kernel.database));
  }

  async getTaxonomicRanks() {
    const ranks = await runQuery(() => query.getTaxonomicRanks(this._kernel.database));
    const ranksMap: Record<number, TaxonomicRank> = {};
    for (const rank of ranks) {
      ranksMap[rank.RankID] = rank;
    }
    return ranksMap;
  }

  async removeTaxonIDs(taxonIDs: number[]) {
    await query.removeTaxonIDs(this._kernel.database, taxonIDs);
  }
}

function _bundleTaxa(taxa: Taxon[]): string {
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
