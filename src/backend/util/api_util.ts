import { RelayedError } from 'electron-ipc-methods';

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
