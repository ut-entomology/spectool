import { AppKernel } from './app_kernel';
import { SavableCredentials } from '../app-util/savable_creds';
import { SpecCollection } from '../shared/schema';

interface SpecPermission {
  specifyUserID: number;
  password: string;
  userType: string;
  collectionID: number;
}

export class UserCredentials extends SavableCredentials {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super(kernel.appName, 'user');
    this.kernel = kernel;
  }

  async login(): Promise<SpecCollection[]> {
    try {
      const rows = await this.kernel.database
        .select('u.specifyUserID', 'u.password', 'r.userType', 'r.collectionID')
        .from<SpecPermission>('user as u')
        .join('spappresourcedir as r', 'u.specifyUserID', 'r.specifyUserID')
        .where('u.name', this.username)
        .whereNotNull('r.collectionID');
      return rows.map((row) => ({
        collectionID: row.collectionID,
        collectionName: row.collectionName
      }));
    } catch (err) {
      await this.clear();
      throw err;
    }
  }
}
