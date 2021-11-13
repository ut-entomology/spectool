import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppPrefs } from '../../shared/app_prefs';
import { AppKernel } from '../../kernel/app_kernel';

class GetAppPrefsIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_app_prefs');
    this.kernel = kernel;
  }

  handle(_data: any) {
    return this.kernel.prefs;
  }
}

class SetAppPrefsIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('set_app_prefs');
    this.kernel = kernel;
  }

  async handle(prefs: AppPrefs) {
    return await this.kernel.savePrefs(prefs);
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new GetAppPrefsIpc(kernel), // multiline
    new SetAppPrefsIpc(kernel)
  ];
}
