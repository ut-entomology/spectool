import { Publisher } from '../app-util/publisher';
import { Connection } from '../shared/connection';

export const connectionPub = new Publisher(new Connection());
