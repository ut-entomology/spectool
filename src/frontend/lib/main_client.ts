import {
  bindMainApi,
  AwaitedType,
  setIpcBindingTimeout
} from 'electron-ipc-methods/window';

import { restorer } from '../../shared/shared_restorer';
import type { AgentApi } from '../../backend/api/agent_api';
import type { AppPrefsApi } from '../../backend/api/app_prefs_api';
import type { DatabaseApi } from '../../backend/api/database_api';
import type { DialogApi } from '../../backend/api/dialog_api';
import type { UserApi } from '../../backend/api/user_api';
import type { SpecimenSetApi } from '../../backend/api/specimen_set_api';
import type { TaxaApi } from '../../backend/api/taxa_api';

export async function bindMainApis() {
  console.log('*** long timeout waiting to bind');
  setIpcBindingTimeout(10000);
  return {
    agentApi: await bindMainApi<AgentApi>('AgentApi', restorer),
    appPrefsApi: await bindMainApi<AppPrefsApi>('AppPrefsApi', restorer),
    databaseApi: await bindMainApi<DatabaseApi>('DatabaseApi', restorer),
    dialogApi: await bindMainApi<DialogApi>('DialogApi', restorer),
    userApi: await bindMainApi<UserApi>('UserApi', restorer),
    specimenSetApi: await bindMainApi<SpecimenSetApi>('SpecimenSetApi', restorer),
    taxaApi: await bindMainApi<TaxaApi>('TaxaApi', restorer)
  };
}

export type MainApis = AwaitedType<typeof bindMainApis>;
