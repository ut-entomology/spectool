import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';
import { runQuery } from '../util/api_util';
import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

const WILDCARD_NAME = '*';
const PRESERVED_SPACE = '^';

export class AgentApi {
  private _kernel: AppKernel;

  constructor(kernel: AppKernel) {
    this._kernel = kernel;
  }

  async getEncodedAgents() {
    // Read all agents from the database.
    const agents = await runQuery(() => query.getAllAgents(this._kernel.database));

    // Collect the words and phonetic codes of all the names.
    const entries: string[] = [];
    for (const agent of agents) {
      const names: string[] = [];
      addAgentNames(names, agent.FirstName);
      addAgentNames(names, agent.MiddleInitial);
      addAgentNames(names, agent.LastName, true);
      addAgentNames(names, agent.Suffix);
      entries.push(names.join(' '));

      const phonetics: string[] = [];
      for (const name of names) {
        if (name == WILDCARD_NAME) {
          phonetics.push(WILDCARD_NAME);
        } else {
          const word = name
            .replace(PRESERVED_SPACE, ' ')
            .replace(/[`']/g, '')
            .replace(/[,.]/g, ' ')
            .trim()
            .replace(/  +/g, ' ');
          phonetics.push(fuzzySoundex(word));
        }
      }
      entries.push(phonetics.join(' '));
    }

    // Return the names in a fast-to-encode reply.
    return entries.join('|');
  }
}

export function addAgentNames(
  names: string[],
  name: string | null | undefined,
  isLastName: boolean = false
) {
  if (!name || name == '') {
    if (isLastName) {
      names.push(WILDCARD_NAME);
    }
  } else {
    names.push(name.replace(/ /g, PRESERVED_SPACE));
  }
}
