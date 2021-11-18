import { IpcHandler, AsyncIpcHandler, SyncIpcHandler } from '../util/ipc_handler';
import { AppKernel } from '../../kernel/app_kernel';
import { Credentials } from '../../shared/credentials';

class GetSavedUserCredsIpc extends SyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_saved_user_creds');
    this.kernel = kernel;
  }

  handler(_data: any) {
    return this.kernel.getSavedUserCreds();
  }
}

class LoginToSpecifyIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_specify');
    this.kernel = kernel;
  }

  async handler(creds: Credentials) {
    return this.kernel.loginUser(creds, false);
  }
}

class LoginToSpecifyAndSaveIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('login_to_specify_and_save');
    this.kernel = kernel;
  }

  async handler(creds: Credentials) {
    return this.kernel.loginUser(creds, true);
  }
}

class LogoutOfSpecifyIpc extends AsyncIpcHandler {
  private kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('logout_of_specify');
    this.kernel = kernel;
  }

  async handler(_data: any) {
    await this.kernel.logoutUser();
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [
    new GetSavedUserCredsIpc(kernel), // multiline
    new LoginToSpecifyIpc(kernel),
    new LoginToSpecifyAndSaveIpc(kernel),
    new LogoutOfSpecifyIpc(kernel)
  ];
}
