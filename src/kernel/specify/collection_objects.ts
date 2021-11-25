import type { Knex } from 'knex';

// import type { SpecLocality } from '../../shared/schema';

export class CollectionObjects {
  async getGeographyIDs(db: Knex, collectionID: number): Promise<number[]> {
    const rows = await db.raw<{ GeographyID: number }[][]>(`
      select distinct loc.GeographyID from locality as loc
      join(
        select ce.LocalityID from collectingevent as ce
        join(
          select CollectingEventID from collectionobject
          where CollectionID=${collectionID}
        ) as ceID
        on ce.CollectingEventID = ceID.CollectingEventID
      ) as locID
      on loc.LocalityID = locID.LocalityID;`);
    const geographyIDs: number[] = [];
    for (const row of rows[0]) {
      if (row.GeographyID !== null) {
        geographyIDs.push(row.GeographyID);
      }
    }
    return geographyIDs;
  }

  // async getLocalities(db: Knex, forGeoIDs: number[]): Promise<SpecLocality> {
  // }
}
