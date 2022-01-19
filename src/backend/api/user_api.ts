import { RelayedError } from 'electron-ipc-methods';

import type { AppKernel } from '../../kernel/app_kernel';
import type { Credentials } from '../../shared/shared_user';

export class UserApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getSavedCreds() {
    try {
      return this._kernel.getSavedUserCreds();
    } catch (err: any) {
      throw new RelayedError(err);
    }
  }

  async login(creds: Credentials) {
    try {
      return this._kernel.loginUser(creds, false);
    } catch (err: any) {
      throw new RelayedError(err);
    }
  }

  async loginAndSave(creds: Credentials) {
    try {
      return this._kernel.loginUser(creds, true);
    } catch (err: any) {
      throw new RelayedError(err);
    }
  }

  async logout() {
    try {
      await this._kernel.logoutUser();
    } catch (err: any) {
      throw new RelayedError(err);
    }
  }
}
