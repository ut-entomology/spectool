import type { RestorableClass } from 'electron-affinity/window';

import { Connection } from '../shared/shared_connection';

const restorationMap: Record<string, RestorableClass<any>> = {
  Connection
};

export function restorer(className: string, obj: Record<string, any>) {
  const restorableClass = restorationMap[className];
  return restorableClass === undefined ? obj : restorableClass['restoreClass'](obj);
}
