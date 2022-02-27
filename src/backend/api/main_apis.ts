import { exposeMainApi, checkMainApi } from 'electron-affinity/main';

import type { AppKernel } from '../../backend/app/app_kernel';
import { AgentApi } from './agent_api';
import { AppPrefsApi } from './app_prefs_api';
import { DatabaseApi } from './database_api';
import { DatabaseConfigApi } from './db_config_api';
import { DialogApi } from './dialog_api';
import { GeographyApi } from './geography_api';
import { LogApi } from './log_api';
import { UserApi } from './user_api';
import { SpecimenSetApi } from './specimen_set_api';
import { TaxaApi } from './taxa_api';

export type MainApis = ReturnType<typeof installMainApis>;

export function installMainApis(kernel: AppKernel) {
  const apis = {
    agentApi: checkMainApi(new AgentApi(kernel)),
    appPrefsApi: checkMainApi(new AppPrefsApi(kernel)),
    databaseApi: checkMainApi(new DatabaseApi(kernel)),
    databaseConfigApi: checkMainApi(new DatabaseConfigApi(kernel)),
    dialogApi: checkMainApi(new DialogApi()),
    geographyApi: checkMainApi(new GeographyApi(kernel)),
    logApi: checkMainApi(new LogApi()),
    userApi: checkMainApi(new UserApi(kernel)),
    specimenSetApi: checkMainApi(new SpecimenSetApi(kernel)),
    taxaApi: checkMainApi(new TaxaApi(kernel))
  };
  for (const api of Object.values(apis)) {
    exposeMainApi(api as any);
  }
  global.mainApis = apis as any;
}
