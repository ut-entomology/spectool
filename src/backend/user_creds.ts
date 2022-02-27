import type { AppKernel } from './app/app_kernel';
import { SavableCredentials } from '../util/savable_creds';
import { toAccessLevel, SpecifyUser } from '../shared/shared_user';
import * as crypto from './specify/crypto';
import * as query from './specify/queries';

export class UserCredentials extends SavableCredentials {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super(kernel.platform.appName, 'user');
    this.kernel = kernel;
  }

  async validate(): Promise<SpecifyUser> {
    if (!this.username) throw Error('Username not provided');
    if (!this.password) throw Error('Password not provided');

    try {
      // Get user per-collection permissions.

      const rows = await query.getUserCredentials(this.kernel.database, this.username);

      // Verify credentials.

      if (rows.length == 0) {
        throw Error('Username not found with access to any collection');
      }
      try {
        if (this.password != crypto.decrypt(rows[0].Password, this.password)) {
          throw Error('Invalid password.');
        }
      } catch (err) {
        throw Error('Invalid password');
      }

      // Return user permissions.

      return {
        id: rows[0].SpecifyUserID,
        name: this.username as string,
        access: rows.map((row) => ({
          collectionID: row.CollectionID,
          accessLevel: toAccessLevel(row.UserType)
        })),
        saved: false // assume for now
      };
    } catch (err) {
      await this.clear();
      throw err;
    }
  }
}
