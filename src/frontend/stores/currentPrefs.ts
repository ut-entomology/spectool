import { createStore } from '../util/create_store';

import { AppPrefs } from '../shared/app_prefs';

export const currentPrefs = createStore('app_prefs', new AppPrefs());
