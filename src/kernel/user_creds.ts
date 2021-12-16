import { AppKernel } from './app_kernel';
import { SavableCredentials } from '../app-util/savable_creds';
import { toAccessLevel } from '../shared/access';
import { SpecifyUser } from '../shared/specify_user';
import * as crypto from './specify/crypto';

interface UserAccess {
  specifyUserID: number;
  password: string;
  userType: string;
  collectionID: number;
}

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

      const rows = await this.kernel.database
        .select<UserAccess[]>(
          'u.specifyUserID',
          'u.password',
          'r.userType',
          'r.collectionID'
        )
        .from('specifyuser as u')
        .join('spappresourcedir as r', 'u.specifyUserID', 'r.specifyUserID')
        .where('u.name', this.username)
        .whereNotNull('r.collectionID');

      // Verify credentials.

      if (rows.length == 0) {
        throw Error('Username not found with access to any collection');
      }
      try {
        if (this.password != crypto.decrypt(rows[0].password, this.password)) {
          throw Error('Invalid password.');
        }
      } catch (err) {
        throw Error('Invalid password');
      }

      // Return user permissions.

      return {
        id: rows[0].specifyUserID,
        name: this.username as string,
        access: rows.map((row) => ({
          collectionID: row.collectionID,
          accessLevel: toAccessLevel(row.userType)
        })),
        saved: false // assume for now
      };
    } catch (err) {
      await this.clear();
      throw err;
    }
  }
}
