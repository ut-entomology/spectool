import { writable } from 'svelte/store';

export const statusMessage = writable<string>('');
