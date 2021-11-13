import { ClientIpc } from '../util/client_ipc';
import type { GeoDictionary } from '../shared/specify_data';

export class GeographyClient {
  static loadGeography(): Promise<void> {
    return ClientIpc.sendAsync(window, 'load_geography');
  }

  static getCountries(): Promise<GeoDictionary> {
    return ClientIpc.sendAsync(window, 'get_countries');
  }

  static getStates(countryID: number): Promise<GeoDictionary> {
    return ClientIpc.sendAsync(window, 'get_states', countryID);
  }
}
