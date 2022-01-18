import type { AppPrefs } from '../../shared/shared_app_prefs';
import type { AppKernel } from '../../kernel/app_kernel';

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
