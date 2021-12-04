import { join } from 'path';
import level from 'level';
import sub from 'subleveldown';

export interface PendingLocality {
  id: number; // locality ID
  geoID: number; // geographic ID
  lat: number; // latitude
  long: number; // longitude
  name: string; // locality hame
  place: string; // named place
  remarks: string; // remarks field
  codes: string; // phonetic codes
}

export class LocalityWork {
  private _store: level.LevelDB<any, any>;
  private _pendingLocalityStore: level.LevelDB<number, PendingLocality>;
  private _phoneticCodeStore: level.LevelDB<string, number[]>;

  constructor(folderPath: string) {
    this._store = level(join(folderPath, 'locality-work'));
    this._pendingLocalityStore = sub(this._store, 'locality', {
      valueEncoding: 'json'
    });
    this._phoneticCodeStore = sub(this._store, 'phonetic', { valueEncoding: 'json' });
  }

  async addPendingLocality(locality: PendingLocality): Promise<void> {
    return this._pendingLocalityStore.put(locality.id, locality);
  }

  async removePendingLocality(localityID: number): Promise<void> {
    return this._pendingLocalityStore.del(localityID);
  }

  async getRemainingGeographicIDs(): Promise<number[]> {
    try {
      return this._store.get('remaining_geographic_IDs');
    } catch (err: any) {
      if (!err.notFound) throw err;
      return [];
    }
  }

  async setRemainingGeographicIDs(remainingIDs: number[]): Promise<void> {
    return this._store.put('remaining_geographic_IDs', remainingIDs);
  }

  async getLocalityIDsForPhoneticCode(phoneticCode: string): Promise<number[]> {
    try {
      return this._phoneticCodeStore.get(phoneticCode);
    } catch (err: any) {
      if (!err.notFound) throw err;
      return [];
    }
  }

  async addLocalityIDToPhoneticCode(
    phoneticCode: string,
    localityID: number
  ): Promise<void> {
    const localityIDs = await this.getLocalityIDsForPhoneticCode(phoneticCode);
    localityIDs.push(localityID);
    return this._phoneticCodeStore.put(phoneticCode, localityIDs);
  }

  async removeLocalityIDFromPhoneticCode(
    phoneticCode: string,
    localityID: number
  ): Promise<void> {
    let localityIDs = await this.getLocalityIDsForPhoneticCode(phoneticCode);
    const localityIndex = localityIDs.indexOf(localityID);
    if (localityIndex >= 0) {
      if (localityIDs.length == 1) {
        return this._phoneticCodeStore.del(phoneticCode);
      } else {
        localityIDs = localityIDs.splice(localityIndex, 1);
        return this._phoneticCodeStore.put(phoneticCode, localityIDs);
      }
    }
  }
}
