const SUFFIXES = ['jr', 'sr', 'ii', 'iii', '1st', '2nd', '3rd'];

export type NicknameMap = Record<string, string[]>;

export const WILDCARD_NAME = '*';

export class AgentName {
  // Words are assumed to have periods and commas removed and no double-spaces
  words: string[]; // a final word of '*' indicates no last name, no suffix
  suffix: string | null; // name suffix, if any
  phoneticCodes: string[]; // phonetics for all words but suffix, except '*' for '*'

  constructor(name: string, phonetics: string) {
    this.words = name.split(' ');
    this.phoneticCodes = phonetics.split(' ');
    const lastWord = this.words[this.words.length - 1];
    this.suffix = SUFFIXES.includes(lastWord.toLowerCase()) ? lastWord : null;
    if (this.suffix) {
      this.words.pop();
      this.phoneticCodes.pop();
    }
  }

  getLastName(): string | null {
    const lastName = this.words[this.words.length - 1];
    return lastName == WILDCARD_NAME ? null : lastName;
  }

  getLastPhoneticCode(): string | null {
    const lastCode = this.phoneticCodes[this.phoneticCodes.length - 1];
    return lastCode == WILDCARD_NAME ? null : lastCode;
  }

  toString() {
    return this.words.join(' ') + (this.suffix ? ', ' + this.suffix : '');
  }
}

export function areSimilarNames(
  nicknamesMap: NicknameMap,
  name1: AgentName,
  name2: AgentName
): boolean {
  // Put the longer name in name1, ignoring any present suffixes

  if (name2.words.length > name1.words.length) {
    [name1, name2] = [name2, name1];
  }

  // Require that every word in the shorter name match a word in the longer name.

  let index1 = 0;
  for (let index2 = 0; index2 < name2.words.length; ++index2) {
    const lowerName2Word = name2.words[index2].toLowerCase();
    const isLastName2 = index2 == name2.words.length - 1;

    // Words in the short name must match those in the longer name in the
    // order in which they appear.

    let matched = false;
    while (!matched && index1 < name1.words.length) {
      const lowerName1Word = name1.words[index1].toLowerCase();
      const isLastName1 = index1 == name1.words.length - 1;
      const nicknames1 = nicknamesMap[lowerName1Word];
      const nicknames2 = nicknamesMap[lowerName2Word];
      matched =
        name1.phoneticCodes[index1] == name2.phoneticCodes[index2] ||
        (!isLastName1 &&
          !isLastName2 &&
          ((nicknames1 && nicknames1.includes(lowerName2Word)) ||
            (nicknames2 && nicknames2.includes(lowerName1Word)))) ||
        lowerName1Word == WILDCARD_NAME ||
        lowerName2Word == WILDCARD_NAME ||
        ((lowerName2Word.length == 1 || lowerName1Word.length == 1) &&
          lowerName1Word[0] == lowerName2Word[0]);
      ++index1;
    }
    if (!matched) {
      return false;
    }
  }

  // Suffixes have to match when both are present.

  if (name1.suffix && name2.suffix) {
    return normalizeSuffix(name1.suffix) == normalizeSuffix(name2.suffix);
  }
  return true;
}

function normalizeSuffix(suffix: string | null) {
  if (suffix) {
    suffix = suffix.toLowerCase();
    if (suffix == '2nd') {
      return 'ii';
    }
    if (suffix == '3rd') {
      return 'iii';
    }
    if (suffix == '4th') {
      return 'iv';
    }
  }
  return suffix;
}

export function parseNicknames(rawNicknames: string): NicknameMap {
  const rawGroups = rawNicknames.split('\n');
  const nicknamesByName: NicknameMap = {};
  for (const rawGroup of rawGroups) {
    if (rawGroup[0] != '#') {
      const names = rawGroup.split(',');
      const group: string[] = [];
      for (let i = 1; i < names.length; ++i) {
        group.push(names[i]);
      }
      nicknamesByName[names[0]] = group;
    }
  }
  return nicknamesByName;
}
