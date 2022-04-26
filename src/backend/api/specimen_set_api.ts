import type { ElectronMainApi } from 'electron-affinity/main';

import type { AppKernel } from '../../backend/app/app_kernel';
import type { PersonName } from '../../backend/csv_validation/csv_specimen';
import {
  getHeaderJSONPath,
  openSpecimenSet,
  getSpecimenSet,
  closeSpecimenSet
} from '../../backend/csv_validation/specimen_set';
import { WILDCARD_NAME, addAgentName, addAgentEntries } from './agent_api';

export class SpecimenSetApi implements ElectronMainApi<SpecimenSetApi> {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getHeaderJSONPath(): Promise<string> {
    return await getHeaderJSONPath(this._kernel);
  }

  async openSpecimenSet(headerJSONPath: string, csvFilePath: string): Promise<void> {
    return await openSpecimenSet(headerJSONPath, csvFilePath);
  }

  async getEncodedAgents(): Promise<string> {
    const specimens = getSpecimenSet().specimens;

    const nameMap: Record<string, boolean> = {};
    nameMap[WILDCARD_NAME] = true; // skip empty name columns
    const entries: string[] = [];
    for (const specimen of specimens) {
      this._addPersons(nameMap, entries, specimen.collectors);
      this._addPersons(nameMap, entries, specimen.determiners);
    }
    return entries.join('|');
  }

  async closeSpecimenSet(): Promise<void> {
    closeSpecimenSet();
  }

  private _addPersons(
    nameMap: Record<string, boolean>,
    entries: string[],
    persons: PersonName[]
  ) {
    for (const person of persons) {
      const names: string[] = [];
      addAgentName(names, person.firstName);
      addAgentName(names, person.lastName, true);
      const name = names.join(' ');
      // skip empty name columns and duplicate names
      if (!nameMap[name]) {
        addAgentEntries(entries, name);
        nameMap[name] = true;
      }
    }
  }
}
