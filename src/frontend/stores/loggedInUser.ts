import { writable } from 'svelte/store';

import type { User } from '../lib/user';

export const loggedInUser = writable<User | null>(null);
