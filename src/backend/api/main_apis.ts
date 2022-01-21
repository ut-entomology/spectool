import { BrowserWindow } from 'electron';
import { exposeMainApi, setIpcBindingTimeout } from 'electron-ipc-methods/main';

import { AppKernel } from '../../kernel/app_kernel';
import { AppPrefsApi } from './app_prefs_api';
import { DatabaseApi } from './database_api';
import { UserApi } from './user_api';
import { TaxaApi } from './taxa_api';

export function installMainApis(kernel: AppKernel) {
  const apis = {
    appPrefsApi: new AppPrefsApi(kernel),
    databaseApi: new DatabaseApi(kernel),
    userApi: new UserApi(kernel),
    taxaApi: new TaxaApi(kernel)
  };
  global.localApis = apis;
  return apis;
}

export function exposeMainApis(toWindow: BrowserWindow) {
  console.log('*** long timeout waiting to be bound');
  setIpcBindingTimeout(10000);
  for (const apiName in global.localApis) {
    const api = (global.localApis as any)[apiName];
    exposeMainApi(toWindow, api);
  }
}

export type LocalApis = ReturnType<typeof installMainApis>;
