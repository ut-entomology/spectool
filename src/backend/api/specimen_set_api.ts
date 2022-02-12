import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

import type { AppKernel } from '../../kernel/app_kernel';
import {
  getHeaderJSONPath,
  openSpecimenSet,
  getSpecimenSet,
  closeSpecimenSet
} from '../../kernel/csv_validation/specimen_set';
import { addAgentNames } from './agent_api';

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

  async getEncodedAgents(): Promise<string> {
    const specimens = getSpecimenSet().specimens;

    const entries: string[] = [];
    for (const specimen of specimens) {
      for (const agent of specimen.collectors) {
        const names: string[] = [];
        addAgentNames(names, agent.firstName);
        addAgentNames(names, agent.lastName, true);
        entries.push(names.join(' '));

        const phonetics: string[] = [];
        for (const name of names) {
          phonetics.push(fuzzySoundex(name));
        }
        entries.push(phonetics.join(' '));
      }
    }
    return entries.join('|');
  }

  async closeSpecimenSet(): Promise<void> {
    closeSpecimenSet();
  }
}
