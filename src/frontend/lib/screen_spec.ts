// Must be JSON reversibly-stringifyable so that reloading a page
// preserves the current page and state, although this is currently
// only implemented for development mode.

export interface ScreenSpec {
  // Electron also defines 'Screen'
  title: string;
  targetName: string;
  params: Record<string, any>;
}
