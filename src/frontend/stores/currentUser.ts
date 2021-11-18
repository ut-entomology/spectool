import { writable } from 'svelte/store';

import type { SpecifyUser } from '../shared/specify_user';

export const currentUser = writable<SpecifyUser | null>(null);
