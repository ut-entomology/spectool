import * as query from './queries';

export class Taxa {
  async loadUnusedTaxaTrees(db: query.DB, oldestDate: Date, newestDate: Date) {
    const unusedTaxa = await query.getUnusedTaxa(db, oldestDate, newestDate);
    return unusedTaxa;
  }
}
