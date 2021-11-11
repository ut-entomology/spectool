import type { SvelteComponent } from 'svelte';

export interface Activity {
  title: string;
  componentType: typeof SvelteComponent;
  description: string;
  requiresLogin: boolean;
}
