import { writable } from 'svelte/store';

import type { DialogSpec } from '../lib/dialog_spec';

export const currentDialog = writable<DialogSpec | null>(null);
