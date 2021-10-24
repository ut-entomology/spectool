import { IpcMainEvent } from 'electron';

import { AppKernel } from '../../kernel/app_kernel';
import { IpcHandler, AsyncIpcHandler } from '../util/ipc_handler';
import { UserRecord } from '../../shared/schema/user_record';

class GetFirstNamesIpc extends AsyncIpcHandler<string, string[]> {
  kernel: AppKernel;

  constructor(kernel: AppKernel) {
    super('get_first_names');
    this.kernel = kernel;
  }

  handle(event: IpcMainEvent, lastName: string): void {
    const obj = this;
    try {
      this.kernel.database
        .select('firstname')
        .from<UserRecord>('agent')
        .where('lastname', lastName)
        .then((rows) => {
          const firstNames: string[] = [];
          for (const row of rows) {
            firstNames.push(row.firstname);
          }
          obj.reply(event, firstNames);
        })
        .catch((err) => {
          obj.reply(event, err);
        });
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.indexOf('credentials') > 0)
          obj.reply(event, Error('Not logged in to database'));
        else obj.reply(event, err);
      } else throw err;
    }
  }
}

export default function (kernel: AppKernel): IpcHandler<any, any>[] {
  return [new GetFirstNamesIpc(kernel)];
}
