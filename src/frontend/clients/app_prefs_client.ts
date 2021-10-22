import { ClientIpc } from "../util/client_ipc";
import type { AppPrefs } from "../shared/app_prefs";

export class AppPrefsClient {
  static getPrefs(
    window: Window,
    onSuccess: (appPrefs: AppPrefs) => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, "get-app-prefs", undefined, onSuccess, onError);
  }

  static setPrefs(
    window: Window,
    appPrefs: AppPrefs,
    onSuccess: () => void,
    onError: (err: Error) => void
  ): void {
    ClientIpc.sendAsync(window, "set-app-prefs", appPrefs, onSuccess, onError);
  }
}
