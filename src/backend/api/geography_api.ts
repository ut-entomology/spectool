import type { AppKernel } from '../../kernel/app_kernel';

export class GeographyApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async loadGeography() {
    const db = this._kernel.database;
    await this._kernel.specifyApi.geography.load(db);
  }

  async getCountries() {
    return this._kernel.specifyApi.geography.getCountries();
  }

  async getCountriesOf(collectionID: number) {
    try {
      const db = this._kernel.database;
      const geoIDs = await this._kernel.specifyApi.collectionObjects.getGeographyIDs(
        db,
        collectionID
      );
      return this._kernel.specifyApi.geography.getCountriesOf(geoIDs);
    } catch (err) {
      console.log(err);
      throw err;
    }
  }

  async getStates(countryID: number) {
    return this._kernel.specifyApi.geography.getChildren(countryID);
  }

  async getStatesOf(collectionID: number, countryID: number) {
    const db = this._kernel.database;
    const geoIDs = await this._kernel.specifyApi.collectionObjects.getGeographyIDs(
      db,
      collectionID
    );
    return this._kernel.specifyApi.geography.getStatesOf(countryID, geoIDs);
  }
}
