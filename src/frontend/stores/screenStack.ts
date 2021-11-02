import { writable } from 'svelte/store';

import type { Screen } from '../lib/screen';

function createScreenStack() {
  const { subscribe, update } = writable<Screen[]>([]);

  return {
    subscribe,
    push: (screen: Screen) =>
      update((screens) => {
        screens.push(screen);
        return screens;
      }),
    pop: () =>
      update((screens) => {
        screens.pop();
        return screens;
      }),
    replace: (screen: Screen) =>
      update((screens) => {
        screens[screens.length - 1] = screen;
        return screens;
      })
  };
}

export const screenStack = createScreenStack();
