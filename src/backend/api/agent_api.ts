import type { AppKernel } from '../../kernel/app_kernel';
import * as query from '../../kernel/specify/queries';
import { runQuery } from '../util/api_util';
import fuzzySoundex from 'talisman/phonetics/fuzzy-soundex';

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
      const words: string[] = [];
      addAgentWords(words, agent.FirstName);
      addAgentWords(words, agent.MiddleInitial);
      addAgentWords(words, agent.LastName, true);
      addAgentWords(words, agent.Suffix);
      entries.push(words.join(' '));

      const phonetics: string[] = [];
      for (const word of words) {
        phonetics.push(fuzzySoundex(word));
      }
      entries.push(phonetics.join(' '));
    }

    // Return the names in a fast-to-encode reply.
    return entries.join('|');
  }
}

export function addAgentWords(
  words: string[],
  name: string | undefined,
  isLastName: boolean = false
) {
  if (name === undefined || name == '') {
    if (isLastName) {
      words.push('*');
    }
  } else {
    const splits = name.replace('.', ' ').replace(',', ' ').split(' ');
    for (const split of splits) {
      if (split != '') {
        words.push(split);
      }
    }
  }
}
