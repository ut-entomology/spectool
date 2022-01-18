import { ClientIpc } from '../util/client_ipc';
import type { GeoDictionary, Region } from '../shared/shared_geography';

export class GeographyClient {
  static loadGeography(): Promise<void> {
    return ClientIpc.sendAsync(window, 'load_geography');
  }

  static getCountries(): Promise<GeoDictionary> {
    return ClientIpc.sendAsync(window, 'get_countries');
  }

  static getCountriesOf(collectionID: number): Promise<Region[]> {
    return ClientIpc.sendAsync(window, 'get_countries_of', collectionID);
  }

  static getChildren(countryID: number): Promise<GeoDictionary> {
    return ClientIpc.sendAsync(window, 'get_states', countryID);
  }

  static getStatesOf(collectionID: number, countryID: number): Promise<Region[]> {
    return ClientIpc.sendAsync(window, 'get_states_of', { collectionID, countryID });
  }
}
