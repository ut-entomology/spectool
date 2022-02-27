let isInDevMode = false;

export function devMode(devMode?: boolean) {
  if (devMode !== undefined) {
    isInDevMode = devMode;
  }
  return isInDevMode;
}
