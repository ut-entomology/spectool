import { ClientIpc } from '../util/client_ipc';

export class DirDialogClient {
  static openDirectoryDialog(title: string): string | null {
    return ClientIpc.sendSync(window, 'open_directory_dialog', title);
  }
}
