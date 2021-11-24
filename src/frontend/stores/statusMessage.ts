import { createStore } from '../util/create_store';

export const statusMessage = createStore<string>('status_message', '');
