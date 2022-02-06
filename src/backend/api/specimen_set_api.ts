import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

import type { AppKernel } from '../../kernel/app_kernel';
import {
  getHeaderJSONPath,
  openSpecimenSet,
  getSpecimenSet,
  closeSpecimenSet
} from '../../kernel/csv_validation/specimen_set';
import { addAgentWords } from './agent_api';

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
        const words: string[] = [];
        addAgentWords(words, agent.firstName);
        addAgentWords(words, agent.lastName, true);
        entries.push(words.join(' '));

        const phonetics: string[] = [];
        for (const word of words) {
          phonetics.push(fuzzySoundex(word));
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
