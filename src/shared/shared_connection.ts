export interface Collection {
  collectionID: number;
  collectionName: string;
}

export class Connection {
  isConfigured; // whether the DB connection has been configured
  username: string | null; // username logged into DB, if logged in
  collections: Collection[]; // collections to which user has access

  constructor(
    isConfigured: boolean = false,
    username: string | null = null,
    collections: Collection[] = []
  ) {
    this.isConfigured = isConfigured;
    this.username = username;
    this.collections = collections;
  }

  getCollection(collectionID: number): Collection | null {
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

  static restoreClass(fromData: Connection) {
    return new Connection(
      fromData.isConfigured,
      fromData.username,
      fromData.collections
    );
  }
}
