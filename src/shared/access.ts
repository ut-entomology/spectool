export enum AccessLevel {
  Manager = 'Manager',
  Full = 'Full Access',
  Limited = 'Limited Access',
  Guest = 'Guest Access'
}

export enum Permissions {
  AddToCollection = 1,
  ModifyCollection = 1 << 1,
  DeleteFromCollection = 1 << 2,
  ManageTaxa = 1 << 3
}

export interface CollectionAccess {
  collectionID: number;
  accessLevel: AccessLevel;
}

export function toAccessLevel(specUserType: string): AccessLevel {
  switch (specUserType) {
    case 'manager':
      return AccessLevel.Manager;
    case 'fullaccess':
      return AccessLevel.Full;
    case 'limitedaccess':
      return AccessLevel.Limited;
    case 'guest':
      return AccessLevel.Guest;
    default:
      throw Error(`Unrecognized Specify UserType '${specUserType}'`);
  }
}

export function toPermissions(accessLevel: AccessLevel): Permissions {
  switch (accessLevel) {
    case AccessLevel.Manager:
      return ~0; // all permissions
    case AccessLevel.Full:
      return (
        Permissions.AddToCollection |
        Permissions.ModifyCollection |
        Permissions.DeleteFromCollection
      );
    case AccessLevel.Limited:
      return Permissions.AddToCollection | Permissions.ModifyCollection;
    case AccessLevel.Guest:
      return 0; // only permission to read
  }
}
