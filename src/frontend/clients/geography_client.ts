import { ClientIpc } from '../util/client_ipc';
import type { GeoDictionary } from '../shared/specify_data';

export class GeographyClient {
  static loadGeography(window: Window): Promise<void> {
    return ClientIpc.sendAsync(window, 'load_geography');
  }

  static getCountries(window: Window): GeoDictionary {
    return ClientIpc.sendSync(window, 'get_countries');
  }

  static getStates(window: Window, countryID: number): GeoDictionary {
    return ClientIpc.sendSync(window, 'get_states', countryID);
  }
}
