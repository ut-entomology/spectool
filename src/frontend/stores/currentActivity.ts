import { writable } from 'svelte/store';

import type { Activity } from '../lib/activity';

export const currentActivity = writable<Activity | null>(null);
