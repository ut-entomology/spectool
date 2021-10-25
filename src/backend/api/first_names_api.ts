import { AppKernel } from '../../kernel/app_kernel';
import { IpcHandler, AsyncIpcHandler } from '../util/ipc_handler';
import { UserRecord } from '../../shared/schema/user_record';

class GetFirstNamesIpc extends AsyncIpcHandler {
  kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_first_names');
    this.kernel = kernel;
  }

  async handle(lastName: string): Promise<string[]> {
    const rows = await this.kernel.database
      .select('firstname')
      .from<UserRecord>('agent')
      .where('lastname', lastName);
    const firstNames: string[] = [];
    for (const row of rows) {
      firstNames.push(row.firstname);
    }
    return firstNames;
  }
}

export default function (kernel: AppKernel): IpcHandler[] {
  return [new GetFirstNamesIpc(kernel)];
}
