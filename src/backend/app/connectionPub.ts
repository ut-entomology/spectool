import { Publisher } from '../../app-util/publisher';
import { Connection } from '../../shared/shared_connection';

export const connectionPub = new Publisher(new Connection());
