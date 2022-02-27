import type { AppKernel } from '../../backend/app_kernel';
import type { AppPrefs } from '../../shared/shared_app_prefs';

export class AppPrefsApi {
  _kernel: AppKernel;

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
