import { AppKernel } from '../../kernel/app_kernel';
import { IpcHandler, AsyncIpcHandler } from '../util/ipc_handler';

class GetFirstNamesIpc extends AsyncIpcHandler {
  kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_first_names');
    this.kernel = kernel;
  }

  async handler(lastName: string) {
    const rows = (
      await this.kernel.database.execute(
        `select FirstName from agent where LastName = ?`,
        [lastName]
      )
    )[0] as { FirstName: string }[];
    const firstNames: string[] = [];
    for (const row of rows) {
      firstNames.push(row.FirstName);
    }
    return firstNames;
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [new GetFirstNamesIpc(kernel)];
}
