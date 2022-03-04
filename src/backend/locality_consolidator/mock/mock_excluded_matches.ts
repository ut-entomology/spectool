import { ExcludedMatchesStore, ExcludedMatchEntry } from '../excluded_matches';

export class MockExcludedMatchesStore extends ExcludedMatchesStore {
  private _entries: Record<string, ExcludedMatchEntry> = {};

  getExcludedMatches(wordSeries: string): ExcludedMatchEntry | null {
    return this._entries[wordSeries] || null;
  }

  protected _setExcludedMatches(wordSeries: string, entry: ExcludedMatchEntry): void {
    this._entries[wordSeries] = entry;
  }
}
