import { createStore } from '../util/create_store';

import type { Activity } from '../lib/activity';

export const currentActivity = createStore<Activity | null>('current_activity', null);
