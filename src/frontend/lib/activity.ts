import type { SvelteComponent } from 'svelte';

import type { Prerequisite } from './prerequisite';

export interface Activity {
  title: string;
  target: typeof SvelteComponent;
  description: string;
  requiresLogin: boolean;
  prerequisites: Prerequisite[];
}
