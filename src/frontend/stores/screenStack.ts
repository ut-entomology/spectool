import { writable } from 'svelte/store';

import type { AppScreen } from '../lib/app_screen';

function createScreenStack() {
  const { subscribe, update } = writable<AppScreen[]>([]);

  return {
    subscribe,
    push: (screen: AppScreen) =>
      update((screens) => {
        screens.push(screen);
        return screens;
      }),
    pop: () =>
      update((screens) => {
        screens.pop();
        return screens;
      }),
    replace: (screen: AppScreen) =>
      update((screens) => {
        screens[screens.length - 1] = screen;
        return screens;
      }),
    reset: () => update((screens) => [screens[0]])
  };
}

export const screenStack = createScreenStack();
