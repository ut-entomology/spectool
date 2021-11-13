import { IpcHandler, AsyncIpcHandler } from '../util/ipc_handler';
import { AppKernel } from '../../kernel/app_kernel';

class LoadGeographyIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('load_geography');
    this.kernel = kernel;
  }

  async handler(_data: any) {
    const db = this.kernel.database;
    await this.kernel.specify.geography.load(db);
  }
}

class GetCountriesIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_countries');
    this.kernel = kernel;
  }

  async handler(_data: any) {
    return this.kernel.specify.geography.getCountries();
  }
}

class GetStatesIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_states');
    this.kernel = kernel;
  }

  async handler(countryID: number) {
    return this.kernel.specify.geography.getStates(countryID);
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new LoadGeographyIpc(kernel), // multiline
    new GetCountriesIpc(kernel),
    new GetStatesIpc(kernel)
  ];
}
