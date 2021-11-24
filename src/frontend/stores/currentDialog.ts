import { createStore } from '../util/create_store';

import type { DialogSpec } from '../lib/dialog_spec';

export const currentDialog = createStore<DialogSpec | null>('current_dialog', null);
