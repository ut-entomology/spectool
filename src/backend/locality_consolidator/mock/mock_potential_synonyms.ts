import { StoredSynonym, PotentialSynonymsStore } from '../potential_synonyms';

export class MockPotentialSynonymsStore extends PotentialSynonymsStore {
  private _synonymsByPhoneticSeries: Record<string, StoredSynonym[]> = {};

  protected _getSynonymList(phoneticSeries: string): StoredSynonym[] | null {
    return this._synonymsByPhoneticSeries[phoneticSeries] || null;
  }

  protected _setSynonymList(phoneticSeries: string, synonyms: StoredSynonym[]): void {
    this._synonymsByPhoneticSeries[phoneticSeries] = synonyms;
  }
}
