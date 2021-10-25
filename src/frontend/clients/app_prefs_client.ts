import { ClientIpc } from '../util/client_ipc';
import type { AppPrefs } from '../shared/app_prefs';

export class AppPrefsClient {
  static getPrefs(window: Window): Promise<AppPrefs> {
    return ClientIpc.sendAsync(window, 'get_app_prefs', undefined);
  }

  static getPrefs2(window: Window): Promise<AppPrefs> {
    return window.ipc.invoke('get_app_prefs', undefined);
  }

  static setPrefs(window: Window, appPrefs: AppPrefs): Promise<void> {
    return ClientIpc.sendAsync(window, 'set_app_prefs', appPrefs);
  }
}
