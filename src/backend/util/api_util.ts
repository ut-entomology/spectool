import { RelayedError } from 'electron-affinity/main';

export async function runQuery<T>(query: () => Promise<T>) {
  try {
    return await query();
  } catch (err: any) {
    if (!err.message.includes('SQL')) {
      throw new RelayedError(err);
    }
    throw err;
  }
}
