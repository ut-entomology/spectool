import { BrowserWindow } from 'electron';
import { exposeMainApi, setIpcBindingTimeout } from 'electron-ipc-methods';

import { AppKernel } from '../kernel/app_kernel';
import { AppPrefsApi } from './api/app_prefs_api';

export function installServerApis(kernel: AppKernel) {
  const apis = { appPrefsApi: new AppPrefsApi(kernel) };
  global.serverApis = apis;
  return apis;
}

export function exposeServerApis(toWindow: BrowserWindow) {
  setIpcBindingTimeout(200000); // TODO: delete or shrink if can
  for (const api of Object.values(global.serverApis)) {
    exposeMainApi(toWindow, api);
  }
}

export type ServerApis = ReturnType<typeof installServerApis>;
