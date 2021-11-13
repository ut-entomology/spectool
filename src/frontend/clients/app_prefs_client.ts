import { ClientIpc } from '../util/client_ipc';
import { AppPrefs } from '../shared/app_prefs';

export class AppPrefsClient {
  static getPrefs(): AppPrefs {
    return new AppPrefs(ClientIpc.sendSync(window, 'get_app_prefs'));
  }

  static setPrefs(appPrefs: AppPrefs): Promise<void> {
    return ClientIpc.sendAsync(window, 'set_app_prefs', appPrefs);
  }
}
