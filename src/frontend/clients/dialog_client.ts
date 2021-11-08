import { ClientIpc } from '../util/client_ipc';

export class DialogClient {
  static openDirectoryDialog(window: Window, title: string): string | null {
    return ClientIpc.sendSync(window, 'open_directory_dialog', title);
  }
}
