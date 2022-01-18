import { createStore } from '../util/create_store';

import type { SpecifyUser } from '../shared/shared_user';

export const currentUser = createStore<SpecifyUser | null>('current_user', null);
