import { bindMainApi, AwaitedType } from 'electron-affinity/window';

import { restorer } from '../../shared/shared_restorer';
import type { AgentApi } from '../../backend/api/agent_api';
import type { AppPrefsApi } from '../../backend/api/app_prefs_api';
import type { DatabaseApi } from '../../backend/api/database_api';
import type { DatabaseConfigApi } from '../../backend/api/db_config_api';
import type { DialogApi } from '../../backend/api/dialog_api';
import type { GeographyApi } from '../../backend/api/geography_api';
import type { LogApi } from '../../backend/api/log_api';
import type { UserApi } from '../../backend/api/user_api';
import type { SpecimenSetApi } from '../../backend/api/specimen_set_api';
import type { TaxaApi } from '../../backend/api/taxa_api';

export type MainApis = AwaitedType<typeof bindMainApis>;

export async function bindMainApis() {
  return {
    agentApi: await bindMainApi<AgentApi>('AgentApi', restorer),
    appPrefsApi: await bindMainApi<AppPrefsApi>('AppPrefsApi', restorer),
    databaseApi: await bindMainApi<DatabaseApi>('DatabaseApi', restorer),
    dbConfigApi: await bindMainApi<DatabaseConfigApi>('DatabaseConfigApi'),
    dialogApi: await bindMainApi<DialogApi>('DialogApi', restorer),
    geographyApi: await bindMainApi<GeographyApi>('GeographyApi'),
    logApi: await bindMainApi<LogApi>('LogApi'),
    userApi: await bindMainApi<UserApi>('UserApi', restorer),
    specimenSetApi: await bindMainApi<SpecimenSetApi>('SpecimenSetApi', restorer),
    taxaApi: await bindMainApi<TaxaApi>('TaxaApi', restorer)
  };
}
