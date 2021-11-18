import type { SvelteComponent } from 'svelte';

export class DialogSpec {
  target: typeof SvelteComponent;
  params: { [key: string]: any };

  constructor(target: typeof SvelteComponent, params: { [key: string]: any } = {}) {
    this.target = target;
    this.params = params;
  }
}
