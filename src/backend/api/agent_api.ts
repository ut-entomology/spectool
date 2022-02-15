import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';
import { runQuery } from '../util/api_util';
import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

export const WILDCARD_NAME = '*';
export const PRESERVED_SPACE = '^';

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
      addAgentName(names, agent.FirstName);
      addAgentName(names, agent.MiddleInitial);
      addAgentName(names, agent.LastName, true);
      addAgentName(names, agent.Suffix);
      addAgentEntries(entries, names.join(' '));
    }

    // Return the names in a fast-to-encode reply.
    return entries.join('|');
  }
}

export function addAgentName(
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

export function addAgentEntries(entries: string[], name: string): void {
  entries.push(name);
  const words = name.replace(/['`]/g, '').match(/[A-Za-z*]+/g);
  entries.push(
    words!
      .map((word) => (word == WILDCARD_NAME ? WILDCARD_NAME : fuzzySoundex(word)))
      .join(' ')
  );
}
