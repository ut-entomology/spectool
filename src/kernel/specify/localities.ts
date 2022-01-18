import type { SpecLocality } from '../../shared/schema';
import * as query from './queries';

export class Localities {
  async getLocalities(db: query.DB, forGeoIDs: number[]): Promise<SpecLocality[]> {
    const rows = await query.getGeographicRegionLocalities(db, forGeoIDs);

    const localities: SpecLocality[] = [];
    rows.forEach((row) =>
      localities.push({
        localityID: row.LocalityID,
        latitude1: row.Latitude1,
        longitude1: row.Longitude1,
        localityName: row.LocalityName
      })
    );
    return localities;
  }
}
