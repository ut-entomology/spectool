import type { CollectionAccess } from './access';

export interface SpecifyUser {
  id: number;
  name: string;
  access: CollectionAccess[];
  saved: boolean;
}
