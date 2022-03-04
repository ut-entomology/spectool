import { PhoneticCodeIndex, PhoneticCodeIndexEntry } from '../phonetic_code_index';

export class MockPhoneticCodeIndex extends PhoneticCodeIndex {
  private _entries: Record<string, PhoneticCodeIndexEntry> = {};

  protected _getIndexEntry(phoneticCode: string): PhoneticCodeIndexEntry | null {
    return this._entries[phoneticCode] || null;
  }

  protected _setIndexEntry(phoneticCode: string, entry: PhoneticCodeIndexEntry): void {
    if (entry.localityIDs.length == 0 && entry.sortedPhoneticSeries.length == 0) {
      delete this._entries[phoneticCode];
    } else {
      this._entries[phoneticCode] = entry;
    }
  }
}
