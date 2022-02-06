const SUFFIXES = ['jr', 'sr', 'ii', 'iii', '2nd', '3rd'];

export const WILDCARD_NAME = '*';

export class AgentName {
  // Words are assumed to have periods and commas removed and no double-spaces
  words: string[]; // a final word of '*' indicates no last name, no suffix
  suffix: string | null; // name suffix, if any
  phonetics: string[]; // phonetics for all words but suffix, except '*' for '*'

  constructor(name: string, phonetics: string) {
    this.words = name.split(' ');
    this.phonetics = phonetics.split(' ');
    const lastWord = this.words[this.words.length - 1];
    this.suffix = SUFFIXES.includes(lastWord.toLowerCase()) ? lastWord : null;
    if (this.suffix) {
      this.words.pop();
      this.phonetics.pop();
    }
  }

  toString() {
    return this.words.join(' ') + (this.suffix ? ', ' + this.suffix : '');
  }
}

export function areSimilarNames(name1: AgentName, name2: AgentName): boolean {
  // Put the longer name in name1, ignoring any present suffixes

  if (name2.words.length > name1.words.length) {
    [name1, name2] = [name2, name1];
  }

  // Require that every word in the shorter name match a word in the longer name.

  let index1 = 0;
  for (let index2 = 0; index2 < name2.words.length; ++index2) {
    const lowerName2Word = name2.words[index2].toLowerCase();

    // Words in the short name must match those in the longer name in the
    // order in which they appear.

    while (index1 < name1.words.length) {
      const name1Word = name1.words[index1];
      if (
        (lowerName2Word != WILDCARD_NAME || name1Word != lowerName2Word) &&
        (name1.phonetics[index1] == name2.phonetics[index2] ||
          name1Word == WILDCARD_NAME ||
          lowerName2Word == WILDCARD_NAME ||
          ((lowerName2Word.length == 1 || name1Word.length == 1) &&
            name1Word[0].toLowerCase() == lowerName2Word[0]))
      ) {
        break; // words match
      }
      ++index1; // words don't match
    }
    if (index1 == name1.words.length) {
      return false;
    }
  }
  return true;
}
