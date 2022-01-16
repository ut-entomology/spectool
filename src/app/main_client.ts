import type { AppPrefsApi } from '../backend/api/app_prefs_api';
import { bindMainApi } from 'electron-ipc-methods';
import type { AwaitedType } from 'electron-ipc-methods';

export async function bindMainApis() {
  return {
    appPrefsApi: await bindMainApi<AppPrefsApi>('AppPrefsApi')
  };
}

export type MainApis = AwaitedType<typeof bindMainApis>;
