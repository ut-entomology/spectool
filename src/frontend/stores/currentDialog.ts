import type { SvelteComponent } from 'svelte';
import { writable } from 'svelte/store';

export const currentDialog = writable<typeof SvelteComponent | null>(null);
