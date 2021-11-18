export enum Permissions {
  AddToCollection = 1,
  ModifyCollection = 1 << 1,
  DeleteFromCollection = 1 << 2,
  ManageTaxa = 1 << 3
}

export interface CollectionAccess {
  collectionID: number;
  permissions: Permissions;
}

export interface SpecifyUser {
  id: number;
  name: string;
  access: CollectionAccess[];
  saved: boolean;
}

export function toPermissions(specUserType: string): Permissions {
  switch (specUserType) {
    case 'manager':
      return ~0; // all permissions
    case 'fullaccess':
      return (
        Permissions.AddToCollection |
        Permissions.ModifyCollection |
        Permissions.DeleteFromCollection
      );
    case 'limitedaccess':
      return Permissions.AddToCollection | Permissions.ModifyCollection;
    case 'guest':
      return 0; // only permission to read
    default:
      throw Error(`Unrecognized Specify UserType '${specUserType}'`);
  }
}
