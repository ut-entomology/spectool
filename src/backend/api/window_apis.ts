import type { BrowserWindow } from 'electron';

import { AwaitedType, bindWindowApi } from 'electron-affinity/main';

import type { AppEventApi } from '../../frontend/api/app_event_api.svelte';

export type MainWindow = AwaitedType<typeof bindMainWindowApis>;

export async function bindMainWindowApis(window: BrowserWindow) {
  return Object.assign(window, {
    apis: {
      appEventApi: await bindWindowApi<AppEventApi>(window, 'AppEventApi')
    }
  });
}
