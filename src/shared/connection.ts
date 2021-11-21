import type { SpecCollection } from '../shared/schema';

export class Connection {
  isConfigured; // whether the DB connection has been configured
  username: string | null; // username logged into DB, if logged in
  collections: SpecCollection[]; // collections to which user has access

  constructor(
    isConfigured: boolean = false,
    username: string | null = null,
    collections: SpecCollection[] = []
  ) {
    this.isConfigured = isConfigured;
    this.username = username;
    this.collections = collections;
  }

  getCollection(collectionID: number): SpecCollection | null {
    for (const collection of this.collections) {
      if (collection.collectionID == collectionID) {
        return collection;
      }
    }
    return null;
  }

  isActive(): boolean {
    return this.collections.length > 0;
  }

  static construct(fromData: Connection) {
    return new Connection(
      fromData.isConfigured,
      fromData.username,
      fromData.collections
    );
  }
}
