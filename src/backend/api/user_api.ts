import { RelayedError } from 'electron-affinity/main';

import type { AppKernel } from '../../kernel/app_kernel';
import type { Credentials } from '../../shared/shared_user';
import * as query from '../../kernel/specify/queries';

export type UserInfo = query.RowType<typeof query.getAllUsers>;

export class UserApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getAllUsers() {
    const users = await query.getAllUsers(this._kernel.database);
    const userMap: Record<number, UserInfo> = {};
    for (const user of users) {
      userMap[user.AgentID] = user;
    }
    return userMap;
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
