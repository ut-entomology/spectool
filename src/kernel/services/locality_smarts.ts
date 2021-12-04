import { join } from 'path';
import level from 'level';
import sub from 'subleveldown';

const WORD_SET_DELIM = '|';

export class LocalitySmarts {
  private _store: level.LevelDB<any, any>;
  private _inequivWordsStore: level.LevelDB<string, string>;

  constructor(folderPath: string) {
    this._store = level(join(folderPath, 'locality-smarts'));
    this._inequivWordsStore = sub(this._store, 'inequiv');
  }

  async getInequivWordSets(wordSetKey: string): Promise<string[]> {
    try {
      const wordSets = await this._inequivWordsStore.get(wordSetKey);
      return wordSets.split(WORD_SET_DELIM);
    } catch (err: any) {
      if (!err.notFound) throw err;
      return [];
    }
  }

  async addInequivWordSet(
    wordSetKey: string,
    inequivWordSetKey: string
  ): Promise<void> {
    let inequivWordSets: string[] = [];
    inequivWordSets = await this.getInequivWordSets(wordSetKey);
    if (inequivWordSets.indexOf(inequivWordSetKey) < 0) {
      inequivWordSets.push(inequivWordSetKey);
      await this._putInequivWordSet(wordSetKey, inequivWordSets);
      inequivWordSets = await this.getInequivWordSets(inequivWordSetKey);
      inequivWordSets.push(wordSetKey);
      await this._putInequivWordSet(inequivWordSetKey, inequivWordSets);
    }
  }

  private async _putInequivWordSet(wordSetKey: string, inequivWordSets: string[]) {
    return this._inequivWordsStore.put(
      wordSetKey,
      inequivWordSets.join(WORD_SET_DELIM)
    );
  }
}
