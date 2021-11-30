import type { Knex } from 'knex';

import type { SpecLocality } from '../../shared/schema';

export class Localities {
  async getLocalities(db: Knex, forGeoIDs: number[]): Promise<SpecLocality[]> {
    const rows = await db
      .select('localityID', 'latitude1', 'longitude1', 'localityName')
      .from('locality')
      .whereIn('geographyID', forGeoIDs);

    const localities: SpecLocality[] = [];
    rows.forEach((row) =>
      localities.push({
        localityID: row.localityID,
        latitude1: row.latitude1,
        longitude1: row.longitude1,
        localityName: row.localityName
      })
    );
    return localities;
  }
}
