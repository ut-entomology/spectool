export enum Permission {
  AddToCollection = 1,
  ModifyCollection = 1 << 1,
  DeleteFromCollection = 1 << 2,
  ManageTaxa = 1 << 3
}

export interface CollectionPermission {
  collectionID: number;
  permission: Permission;
}

export interface SpecifyUser {
  username: string;
  passwordHash: string;
  permissions: CollectionPermission[];
}
