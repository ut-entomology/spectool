import { writable } from 'svelte/store';

import { Connection } from '../shared/connection';

export const currentConnection = writable(new Connection());
