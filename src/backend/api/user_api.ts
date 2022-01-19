import type { AppKernel } from '../../kernel/app_kernel';
import type { Credentials } from '../../shared/shared_user';

export class UserApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getSavedCreds() {
    return this._kernel.getSavedUserCreds();
  }

  async login(creds: Credentials) {
    return this._kernel.loginUser(creds, false);
  }

  async loginAndSave(creds: Credentials) {
    return this._kernel.loginUser(creds, true);
  }

  async logout() {
    await this._kernel.logoutUser();
  }
}
