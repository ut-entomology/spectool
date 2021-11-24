import { createStore } from '../util/create_store';

import { Connection } from '../shared/connection';

export const currentConnection = createStore(
  'current_connection',
  new Connection(),
  (value) => Connection.construct(value)
);
