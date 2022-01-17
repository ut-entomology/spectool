import {
  bindMainApi,
  AwaitedType,
  setIpcBindingTimeout,
  RestorableClass
} from 'electron-ipc-methods/window';

import type { AppPrefsApi } from '../../backend/api/app_prefs_api';
import type { DatabaseApi } from '../../backend/api/database_api';
import { Connection } from '../shared/connection';

export async function bindMainApis() {
  console.log('*** long timeout waiting to bind');
  setIpcBindingTimeout(10000);
  return {
    appPrefsApi: await bindMainApi<AppPrefsApi>('AppPrefsApi', restorer),
    databaseApi: await bindMainApi<DatabaseApi>('DatabaseApi', restorer)
  };
}

export type MainApis = AwaitedType<typeof bindMainApis>;

const restorationMap: Record<string, RestorableClass<any>> = {
  Connection
};

function restorer(className: string, obj: Record<string, any>) {
  const restorableClass = restorationMap[className];
  return restorableClass === undefined ? obj : restorableClass['restoreClass'](obj);
}
