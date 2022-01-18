import { CollectionObjects } from './specify/collection_objects';
import { Geography } from './specify/geography';
import { Localities } from './specify/localities';
import { Taxa } from './specify/taxa';

export class SpecifyApi {
  collectionObjects = new CollectionObjects();
  geography = new Geography();
  localities = new Localities();
  taxa = new Taxa();
}
