const SUFFIXES = ['jr', 'sr', 'ii', 'iii', '1st', '2nd', '3rd'];

export type NicknameMap = Record<string, string[]>;
export type AgentNamesByGroup = Record<string, AgentName[]>;

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

  getLastNameCode(): string {
    return this.phoneticCodes[this.phoneticCodes.length - 1];
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
    return _normalizeSuffix(name1.suffix) == _normalizeSuffix(name2.suffix);
  }
  return true;
}

export function compareNames(
  nicknamesMap: NicknameMap,
  nameGroups: AgentNamesByGroup
): AgentName[][] {
  const similarityGroups: AgentName[][] = [];
  const similarityGroupsByInitialName: Record<string, AgentName[] | null> = {};

  // Process last names, collecting groups of similar names.

  for (const lastName of Object.keys(nameGroups)) {
    // Process the names in order of word length, so that the longest (and
    // presumably most complete) names appear first in each similarity group.
    // The remaining names are proposed synonyms of the first.

    const names = nameGroups[lastName].sort((a, b) =>
      a.words.length <= b.words.length ? -1 : 1
    );
    for (let i = 0; i < names.length - 1; ++i) {
      // Each similarity group consists of the names in the list that are
      // similar to any name but follow that name. This ensures that those
      // similar to the longer names get grouped with the longer names,
      // since those names are presumably the more complete names, while
      // shorter names get grouped with shorter names only if they couldn't
      // be grouped with longer names.

      const outerName = names[i];
      const similarNames: AgentName[] = [outerName];
      for (let j = i + 1; j < names.length; ++j) {
        const innerName = names[j];
        if (
          areSimilarNames(nicknamesMap, outerName, innerName) &&
          outerName.toString() != innerName.toString()
        ) {
          similarNames.push(innerName);
        }
      }

      // Whenever two or more names are found to be similar, collect them,
      // and index them by the initial name of the group.

      if (similarNames.length >= 2) {
        similarityGroups.push(similarNames);
        similarityGroupsByInitialName[similarNames[0].toString()] = similarNames;
      }
    }
  }

  // Remove the similarity groups that are entirely subsets of earlier
  // similarity groups, since the prior similarity groups already report
  // their similarity. Check in order of creation of similarity groups so
  // that those most likely to contain other groups are processed first,
  // reducing later processing.

  for (const outerSimilarityGroup of similarityGroups) {
    // Only examine similarity groups that have not been removed.

    if (similarityGroupsByInitialName[outerSimilarityGroup[0].toString()]) {
      // Check the remainder of the group for the existence of subset groups.

      for (let i = 1; i < outerSimilarityGroup.length; ++i) {
        // When a subset group exists, see if all other members of the group
        // are also subsets of the outer similarity group being examined.

        const nameToCheck = outerSimilarityGroup[i].toString();
        const groupOfNameToCheck = similarityGroupsByInitialName[nameToCheck];
        if (groupOfNameToCheck) {
          let isSubsetOfOuterSimilarityGroup = true;
          for (let j = 1; j < groupOfNameToCheck.length; ++j) {
            if (!outerSimilarityGroup.includes(groupOfNameToCheck[j])) {
              isSubsetOfOuterSimilarityGroup = false;
              break;
            }
          }

          // If the checked group is entirely a subset of the outer similarity
          // group, remove it.

          if (isSubsetOfOuterSimilarityGroup) {
            similarityGroupsByInitialName[nameToCheck] = null;
          }
        }
      }
    }
  }

  // Return the similarity groups sorted first by last name and then by full
  // name, leaving out the groups that were subsets of other groups. Sort
  // each similarity group alphabetically.

  const prunedSimilarityGroups: AgentName[][] = [];
  for (const similarityGroup of similarityGroups) {
    if (similarityGroupsByInitialName[similarityGroup[0].toString()]) {
      similarityGroup.sort(_nameStringSorter);
      prunedSimilarityGroups.push(similarityGroup);
    }
  }
  return prunedSimilarityGroups.sort((a, b) => _fullNameSorter(a[0], b[0]));
}

export function compareToTrustedNames(
  nicknamesMap: NicknameMap,
  trustedNameGroups: AgentNamesByGroup,
  untrustedNameGroups: AgentNamesByGroup
): AgentName[][] {
  const similarityGroups: AgentName[][] = [];

  // Process trusted last names in alphabetic order, collecting groups of similar names.

  const sortedTrustedLastNames = Object.keys(trustedNameGroups).sort();
  for (const lastName of sortedTrustedLastNames) {
    // Process the untrusted names having the current trusted last name.

    if (lastName == WILDCARD_NAME) {
      // Process all trusted names that are missing a last name.

      const sortedTrustedNames = trustedNameGroups[lastName].sort(_nameStringSorter);
      for (const trustedName of sortedTrustedNames) {
        // Compare the trusted name to every untrusted name for possible similarity.

        const similarNamesGroup: AgentName[] = [];
        for (const untrustedNames of Object.values(untrustedNameGroups)) {
          const similarNames = _getSimilarNames(
            nicknamesMap,
            trustedName,
            untrustedNames
          );
          if (similarNames) {
            similarNamesGroup.push(...similarNames);
          }
        }
        if (similarNamesGroup.length > 0) {
          similarNamesGroup.sort(_fullNameSorter);
          similarNamesGroup.unshift(trustedName);
          similarityGroups.push(similarNamesGroup);
        }
      }
    } else {
      // Only similar names are collected, so skips last names not found
      // among both the trusted and untrusted names, but includes all
      // untrusted names lacking last names.

      const untrustedNames = untrustedNameGroups[lastName] || [];
      const untrustedWithoutLastNames = untrustedNameGroups[WILDCARD_NAME];
      if (untrustedWithoutLastNames) {
        untrustedNames.push(...untrustedWithoutLastNames);
      }
      if (untrustedNames.length > 0) {
        // Process the trusted names having the current last name in alphabetic
        // order so they are listed in this order in the report.

        const sortedTrustedNames = trustedNameGroups[lastName].sort(_nameStringSorter);
        const sortedUntrustedNames = untrustedNames.sort(_nameStringSorter);
        for (const trustedName of sortedTrustedNames) {
          // Collect untrusted names that are similar to the trusted name, doing so
          // in alphabetic order so that they list in alphabetic order in the report.
          // The first name in each group of similar names is the trusted name.

          const similarNamesGroup = _getSimilarNames(
            nicknamesMap,
            trustedName,
            sortedUntrustedNames
          );
          if (similarNamesGroup) {
            similarNamesGroup.unshift(trustedName);
            similarityGroups.push(similarNamesGroup);
          }
        }
      }
    }
  }
  return similarityGroups;
}

export function parseEncodedAgents(encodings: string): AgentNamesByGroup {
  const namesByGroup: AgentNamesByGroup = {};
  const entries = encodings.split('|');
  for (let i = 0; i < entries.length; i += 2) {
    const agentName = new AgentName(entries[i], entries[i + 1]);
    const groupCode = agentName.getLastNameCode();

    let group = namesByGroup[groupCode];
    if (!group) {
      group = [];
      namesByGroup[groupCode] = group;
    }
    group.push(agentName);
  }
  return namesByGroup;
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

function _fullNameSorter(nameA: AgentName, nameB: AgentName) {
  const lastA = nameA.words[nameA.words.length - 1];
  const lastB = nameB.words[nameB.words.length - 1];
  return lastA <= lastB && nameA.toString() <= nameB.toString() ? -1 : 1;
}

function _getSimilarNames(
  nicknamesMap: NicknameMap,
  trustedName: AgentName,
  untrustedNames: AgentName[]
): AgentName[] | null {
  const similarNames: AgentName[] = [];
  for (const untrustedName of untrustedNames) {
    if (
      areSimilarNames(nicknamesMap, trustedName, untrustedName) &&
      trustedName.toString() != untrustedName.toString()
    ) {
      similarNames.push(untrustedName);
    }
  }
  // similarity groups require at least 2 similar names
  return similarNames.length > 0 ? similarNames : null;
}

function _nameStringSorter(a: AgentName, b: AgentName) {
  return a.toString() <= b.toString() ? -1 : 1;
}

function _normalizeSuffix(suffix: string | null) {
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
