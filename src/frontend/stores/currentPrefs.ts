import { createStore } from '../util/create_store';

import { AppPrefs } from '../shared/shared_app_prefs';

export const currentPrefs = createStore('app_prefs', new AppPrefs());
