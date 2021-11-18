import { writable } from 'svelte/store';

import { AppPrefs } from '../shared/app_prefs';

export const currentPrefs = writable(new AppPrefs());
