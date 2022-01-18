import { ClientIpc } from '../util/client_ipc';
import type { Credentials, SpecifyUser } from '../../shared/shared_user';

export class UserClient {
  static getSavedCreds(): Credentials | null {
    return ClientIpc.sendSync(window, 'get_saved_user_creds');
  }

  static login(creds: Credentials): Promise<SpecifyUser> {
    return ClientIpc.sendAsync(window, 'login_to_specify', creds);
  }

  static loginAndSave(creds: Credentials): Promise<SpecifyUser> {
    return ClientIpc.sendAsync(window, 'login_to_specify_and_save', creds);
  }

  static logout(): Promise<void> {
    return ClientIpc.sendAsync(window, 'logout_of_specify');
  }
}
