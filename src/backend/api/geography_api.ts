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
    await this.kernel.specifyApi.geography.load(db);
  }
}

class GetCountriesIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_countries');
    this.kernel = kernel;
  }

  async handler(_data: any) {
    return this.kernel.specifyApi.geography.getCountries();
  }
}

class GetCountriesOfIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_countries_of');
    this.kernel = kernel;
  }

  async handler(collectionID: number) {
    try {
      const db = this.kernel.database;
      const geoIDs = await this.kernel.specifyApi.collectionObjects.getGeographyIDs(
        db,
        collectionID
      );
      return this.kernel.specifyApi.geography.getCountriesOf(geoIDs);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

class GetStatesIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_states');
    this.kernel = kernel;
  }

  async handler(countryID: number) {
    return this.kernel.specifyApi.geography.getChildren(countryID);
  }
}

class GetStatesOfIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_states_of');
    this.kernel = kernel;
  }

  async handler(data: { collectionID: number; countryID: number }) {
    const db = this.kernel.database;
    const geoIDs = await this.kernel.specifyApi.collectionObjects.getGeographyIDs(
      db,
      data.collectionID
    );
    return this.kernel.specifyApi.geography.getStatesOf(data.countryID, geoIDs);
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new LoadGeographyIpc(kernel), // multiline
    new GetCountriesIpc(kernel),
    new GetCountriesOfIpc(kernel),
    new GetStatesIpc(kernel),
    new GetStatesOfIpc(kernel)
  ];
}
