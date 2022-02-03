import type { AppKernel } from '../../kernel/app_kernel';
import {
  getHeaderJSONPath,
  openSpecimenSet,
  closeSpecimenSet
} from '../../kernel/csv_validation/specimen_set';

export class SpecimenSetApi {
  _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getHeaderJSONPath(): Promise<string> {
    return await getHeaderJSONPath(this._kernel);
  }

  async openSpecimenSet(csvFilePath: string, headerJSONPath: string): Promise<void> {
    return await openSpecimenSet(csvFilePath, headerJSONPath);
  }

  async closeSpecimenSet(): Promise<void> {
    closeSpecimenSet();
  }
}
