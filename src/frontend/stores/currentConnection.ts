import { createStore } from '../util/create_store';

import { Connection } from '../../shared/shared_connection';

export const currentConnection = createStore(
  'current_connection',
  new Connection(),
  (value) => Connection.restoreClass(value)
);
