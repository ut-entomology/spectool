import type { ElectronMainApi } from 'electron-affinity/main';

import type { AppKernel } from '../../backend/app/app_kernel';
import type { AppPrefs } from '../../shared/shared_app_prefs';

export class AppPrefsApi implements ElectronMainApi<AppPrefsApi> {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getPrefs() {
    return this._kernel.appPrefs;
  }

  async setPrefs(prefs: AppPrefs) {
    return await this._kernel.saveAppPrefs(prefs);
  }
}
