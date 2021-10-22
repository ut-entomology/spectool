import { IpcMainEvent } from 'electron';

import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppPrefs } from '../../shared/app_prefs';
import { AppKernel } from '../../kernel/app_kernel';

class GetAppPrefsIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get-app-prefs');
    this.kernel = kernel;
  }

  handle(event: IpcMainEvent, _data: any): void {
    this.reply(event, this.kernel.prefs);
  }
}

class SetAppPrefsIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('set-app-prefs');
    this.kernel = kernel;
  }

  handle(event: IpcMainEvent, prefs: AppPrefs): void {
    const obj = this;
    this.kernel
      .savePrefs(prefs)
      .then(() => {
        obj.reply(event, undefined);
      })
      .catch((err) => {
        obj.reply(event, err);
      });
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [new GetAppPrefsIpc(kernel), new SetAppPrefsIpc(kernel)];
}
