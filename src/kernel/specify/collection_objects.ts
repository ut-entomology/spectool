import * as query from './queries';

export class CollectionObjects {
  async getGeographyIDs(db: query.DB, collectionID: number): Promise<number[]> {
    const rows = await query.getCollectionGeographyIDs(db, collectionID);
    const geographyIDs: number[] = [];
    for (const row of rows) {
      if (row.GeographyID !== null) {
        geographyIDs.push(row.GeographyID);
      }
    }
    return geographyIDs;
  }
}
