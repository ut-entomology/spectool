import { ClientIpc } from '../util/client_ipc';
import type { GeoDictionary } from '../shared/specify_data';
import type { GeoEntity } from '../shared/geo_entity';

export class GeographyClient {
  static loadGeography(): Promise<void> {
    return ClientIpc.sendAsync(window, 'load_geography');
  }

  static getCountries(): Promise<GeoDictionary> {
    return ClientIpc.sendAsync(window, 'get_countries');
  }

  static getCountriesOf(collectionID: number): Promise<GeoEntity[]> {
    return ClientIpc.sendAsync(window, 'get_countries_of', collectionID);
  }

  static getStates(countryID: number): Promise<GeoDictionary> {
    return ClientIpc.sendAsync(window, 'get_states', countryID);
  }

  static getStatesOf(collectionID: number, countryID: number): Promise<GeoEntity[]> {
    return ClientIpc.sendAsync(window, 'get_states_of', { collectionID, countryID });
  }
}
