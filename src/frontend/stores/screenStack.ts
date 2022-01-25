import { createStore } from '../util/create_store';

import type { ScreenSpec } from '../lib/screen_spec';

function createScreenStack() {
  const { subscribe, update } = createStore<ScreenSpec[]>('screen_stack', []);

  return {
    subscribe,
    push: (screen: ScreenSpec) =>
      update((screens) => {
        screens.push(screen);
        return screens;
      }),
    pop: (paramsModifier?: (params: Record<string, any>) => void) =>
      update((screens) => {
        screens.pop();
        if (paramsModifier) {
          paramsModifier(screens[screens.length - 1].params);
        }
        return screens;
      }),
    replace: (screen: ScreenSpec) =>
      update((screens) => {
        screens[screens.length - 1] = screen;
        return screens;
      }),
    reset: () => update((screens) => [screens[0]])
  };
}

export const screenStack = createScreenStack();
