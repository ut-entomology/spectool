import { BrowserWindow } from 'electron';
import { exposeMainApi, setIpcBindingTimeout } from 'electron-ipc-methods/main';

import { AppKernel } from '../kernel/app_kernel';
import { AppPrefsApi } from './api/app_prefs_api';
import { DatabaseApi } from './api/database_api';

export function installServerApis(kernel: AppKernel) {
  const apis = {
    appPrefsApi: new AppPrefsApi(kernel),
    databaseApi: new DatabaseApi(kernel)
  };
  global.serverApis = apis;
  return apis;
}

export function exposeServerApis(toWindow: BrowserWindow) {
  console.log('*** long timeout waiting to be bound');
  setIpcBindingTimeout(10000);
  for (const apiName in global.serverApis) {
    const api = (global.serverApis as any)[apiName];
    exposeMainApi(toWindow, api);
  }
}

export type ServerApis = ReturnType<typeof installServerApis>;
