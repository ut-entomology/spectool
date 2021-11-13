import { dialog } from 'electron';
import { AppKernel } from '../../kernel/app_kernel';
import { IpcHandler, SyncIpcHandler } from '../util/ipc_handler';

class OpenDirectoryDialogIpc extends SyncIpcHandler {
  constructor() {
    super('open_directory_dialog');
  }

  handle(title: string) {
    const selections = dialog.showOpenDialogSync({
      title,
      properties: [
        'openDirectory',
        'createDirectory',
        'promptToCreate',
        'dontAddToRecent'
      ]
    });
    if (!selections) return null;
    return selections[0];
  }
}

export default function (_kernel: AppKernel): IpcHandler[] {
  return [
    new OpenDirectoryDialogIpc() // multiline
  ];
}
