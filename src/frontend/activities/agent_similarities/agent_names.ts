const SUFFIXES = ['jr', 'sr', 'ii', 'iii', '1st', '2nd', '3rd'];

export type NicknameMap = Record<string, string[]>;
export type AgentNamesByGroup = Record<string, AgentName[]>;

export interface AgentComparison {
  groups: AgentName[][];
  unknownLastNameGroup: AgentName[];
}

export const WILDCARD_NAME = '*';

export class AgentName {
  name: string;
  words: string[] = []; // a final word of '*' indicates no last name, no suffix
  suffix: string | null; // name suffix, if any
  phoneticCodes: string[]; // phonetics for all words but suffix, except '*' for '*'

  constructor(name: string, phonetics: string) {
    this.name = name;
    const splits = name
      .trim()
      .toLowerCase()
      .replace(/[`']/g, '')
      .replace(/[.,]/g, ' ')
      .split(' ');
    for (const split of splits) {
      if (split != '') {
        this.words.push(split);
      }
    }
    this.phoneticCodes = phonetics.split(' ');
    const lastWord = this.words[this.words.length - 1];
    this.suffix = SUFFIXES.includes(lastWord) ? lastWord : null;
    if (this.suffix) {
      this.words.pop();
      this.phoneticCodes.pop();
    }
  }

  getLastNameCode(): string {
    return this.phoneticCodes[this.phoneticCodes.length - 1];
  }

  toNormString() {
    return this.words.join(' ') + (this.suffix ? ', ' + this.suffix : '');
  }
}

export const missingLastNameStandIn = new AgentName('*', '*');

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
    const name2Word = name2.words[index2];
    const isLastName2 = index2 == name2.words.length - 1;

    // Words in the short name must match those in the longer name in the
    // order in which they appear.

    let matched = false;
    while (!matched && index1 < name1.words.length) {
      const name1Word = name1.words[index1];
      const isLastName1 = index1 == name1.words.length - 1;
      const nicknames1 = nicknamesMap[name1Word];
      const nicknames2 = nicknamesMap[name2Word];
      matched =
        name1.phoneticCodes[index1] == name2.phoneticCodes[index2] ||
        (!isLastName1 &&
          !isLastName2 &&
          ((nicknames1 && nicknames1.includes(name2Word)) ||
            (nicknames2 && nicknames2.includes(name1Word)))) ||
        name1Word == WILDCARD_NAME ||
        name2Word == WILDCARD_NAME ||
        ((name2Word.length == 1 || name1Word.length == 1) &&
          name1Word[0] == name2Word[0]);
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

/**
 * Compares agent names with one another, trusting that none are necessarily
 * correct. It returns a set of lists of names, the names in each list being
 * similar to one another, with no two lists containing exactly the same names.
 * The first name in each list is the longest name of the list (by number of
 * words), each list is otherwise ordered first by last name and then by full
 * name, and the set is ordered by the first names in each list.
 */

export function compareUntrustedNames(
  nicknamesMap: NicknameMap,
  nameGroups: AgentNamesByGroup
): AgentComparison {
  const similarityGroups: AgentName[][] = [];
  const similarityGroupsByInitialName: Record<string, AgentName[] | null> = {};
  const namesWithoutLastNames = nameGroups[WILDCARD_NAME];

  // Process last names, collecting groups of similar names.

  for (const lastNameCode of Object.keys(nameGroups).sort()) {
    // Process the names in order of name complexity, so that the presumed
    // most-complete names appear first in each similarity group.
    // The remaining names are proposed synonyms of the first.

    const names = nameGroups[lastNameCode].slice();
    if (lastNameCode != WILDCARD_NAME && namesWithoutLastNames) {
      names.push(...namesWithoutLastNames);
    }
    names.sort(_sorterOfNameComplexity);
    for (let i = 0; i < names.length - 1; ++i) {
      // Each similarity group consists of the names in the list that are
      // similar to any name but follow that name. This ensures that those
      // similar to the longer names get grouped with the longer names,
      // since those names are presumably the more complete names, while
      // shorter names get grouped with shorter names only if they couldn't
      // be grouped with longer names.

      const outerName = names[i];
      const similarNames = _getSimilarNames(nicknamesMap, outerName, names, i + 1);

      // Whenever there is at least one similar name, collect the names into
      // a group that begins with the outer name, and index them by the initial
      // name of the group.

      if (similarNames) {
        similarNames.unshift(outerName);
        similarityGroups.push(similarNames);
        similarityGroupsByInitialName[similarNames[0].name] = similarNames;
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

    if (similarityGroupsByInitialName[outerSimilarityGroup[0].name]) {
      // Check the remainder of the group for the existence of subset groups.

      for (let i = 1; i < outerSimilarityGroup.length; ++i) {
        // When a subset group exists, see if all other members of the group
        // are also subsets of the outer similarity group being examined.

        const nameToCheck = outerSimilarityGroup[i].name;
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
  // name, leaving out the groups that were subsets of other groups.

  const prunedSimilarityGroups: AgentName[][] = [];
  for (const similarityGroup of similarityGroups) {
    if (similarityGroupsByInitialName[similarityGroup[0].name]) {
      prunedSimilarityGroups.push(similarityGroup);
    }
  }
  return {
    groups: prunedSimilarityGroups.sort((a, b) => _sorterOfFullNames(a[0], b[0])),
    unknownLastNameGroup: namesWithoutLastNames
      ? namesWithoutLastNames.sort(_sorterOfNormStrings)
      : []
  };
}

/**
 * Compares an untrusted set of agent names to a trusted set of agent names,
 * returning lists of agent names, each list beginning with a trusted name and
 * followed by all the untrusted names that are similar to it. The set is
 * ordered by trusted name, last name first, as are the untrusted names that
 * follow each trusted name in the list.
 */

export function compareToTrustedNames(
  nicknamesMap: NicknameMap,
  trustedNameGroups: AgentNamesByGroup,
  untrustedNameGroups: AgentNamesByGroup
): AgentComparison {
  const similarityGroups: AgentName[][] = [];

  // Process trusted last names in alphabetic order, collecting groups of similar names.

  const sortedTrustedLastNameCodes = Object.keys(trustedNameGroups).sort();
  const untrustedWithoutLastNames = untrustedNameGroups[WILDCARD_NAME];

  for (const lastNameCode of sortedTrustedLastNameCodes) {
    // Process the untrusted names having the current trusted last name.

    if (lastNameCode == WILDCARD_NAME) {
      // Process all trusted names that are missing a last name.

      const sortedTrustedNames =
        trustedNameGroups[lastNameCode].sort(_sorterOfNormStrings);
      for (const trustedName of sortedTrustedNames) {
        // Compare the trusted name to every untrusted name for possible similarity.

        const similarNamesGroup: AgentName[] = [];
        for (const untrustedNames of Object.values(untrustedNameGroups)) {
          const similarNames = _getSimilarNames(
            nicknamesMap,
            trustedName,
            untrustedNames,
            0
          );
          if (similarNames) {
            similarNamesGroup.push(...similarNames);
          }
        }
        if (similarNamesGroup.length > 0) {
          similarNamesGroup.sort(_sorterOfNameComplexity);
          similarNamesGroup.unshift(trustedName);
          similarityGroups.push(similarNamesGroup);
        }
      }
    } else {
      // Only similar names are collected, so skips last names not found
      // among both the trusted and untrusted names, but includes all
      // untrusted names lacking last names.

      let untrustedNames = untrustedNameGroups[lastNameCode];
      untrustedNames = untrustedNames ? untrustedNames.slice() : [];
      if (untrustedWithoutLastNames) {
        untrustedNames.push(...untrustedWithoutLastNames);
      }
      if (untrustedNames.length > 0) {
        // Process the trusted names having the current last name in complexity
        // order so they are listed in this order in the report.

        const sortedTrustedNames =
          trustedNameGroups[lastNameCode].sort(_sorterOfNormStrings);
        untrustedNames.sort(_sorterOfNameComplexity);
        for (const trustedName of sortedTrustedNames) {
          // Collect untrusted names that are similar to the trusted name. The
          // first name in each group of similar names is the trusted name.

          const similarNamesGroup = _getSimilarNames(
            nicknamesMap,
            trustedName,
            untrustedNames,
            0
          );
          if (similarNamesGroup) {
            similarNamesGroup.unshift(trustedName);
            similarityGroups.push(similarNamesGroup);
          }
        }
      }
    }
  }
  return {
    groups: similarityGroups,
    unknownLastNameGroup: untrustedWithoutLastNames
      ? untrustedWithoutLastNames.sort(_sorterOfNormStrings)
      : []
  };
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

function _getSimilarNames(
  nicknamesMap: NicknameMap,
  outerName: AgentName,
  innerNames: AgentName[],
  innerIndex: number
): AgentName[] | null {
  const similarNames: AgentName[] = [];
  const outerHasFirstName = outerName.words.length > 1;
  let includedNamesWithoutLastNames = false;
  while (innerIndex < innerNames.length) {
    const innerName = innerNames[innerIndex];
    if (
      !outerHasFirstName &&
      innerName.words[innerName.words.length - 1] == WILDCARD_NAME
    ) {
      if (!includedNamesWithoutLastNames) {
        similarNames.push(missingLastNameStandIn);
        includedNamesWithoutLastNames = true;
      }
    } else if (
      areSimilarNames(nicknamesMap, outerName, innerName) &&
      outerName.name != innerName.name
    ) {
      similarNames.push(innerName);
    }
    innerIndex += 1;
  }
  // similarity groups require at least 2 similar names
  return similarNames.length > 0 ? similarNames : null;
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

function _sorterOfFullNames(nameA: AgentName, nameB: AgentName): number {
  const lastA = nameA.words[nameA.words.length - 1];
  const lastB = nameB.words[nameB.words.length - 1];
  const [normA, normB] = [nameA.toNormString(), nameB.toNormString()];
  if (lastA == lastB && normA == normB) return 0;
  return lastA < lastB || (lastA == lastB && normA < normB) ? -1 : 1;
}

function _sorterOfNameComplexity(nameA: AgentName, nameB: AgentName): number {
  // Names with last names precede those without.
  const [nameAWordLength, nameBWordLength] = [nameA.words.length, nameB.words.length];
  if (
    nameB.words[nameBWordLength - 1] == WILDCARD_NAME &&
    nameA.words[nameAWordLength - 1] != WILDCARD_NAME
  ) {
    return -1;
  }
  if (
    nameA.words[nameAWordLength - 1] == WILDCARD_NAME &&
    nameB.words[nameBWordLength - 1] != WILDCARD_NAME
  ) {
    return 1;
  }

  // Names with more words precede those with fewer.
  if (nameAWordLength != nameBWordLength) {
    return nameBWordLength - nameAWordLength;
  }

  // Names with suffixes precede those without.
  if (nameA.suffix != null && nameB.suffix == null) {
    return -1;
  }
  if (nameB.suffix != null && nameA.suffix == null) {
    return 1;
  }

  // Names with more characters precede those with fewer.
  const [nameAStr, nameBStr] = [nameA.toNormString(), nameB.toNormString()];
  if (nameAStr.length != nameBStr.length) {
    return nameBStr.length - nameAStr.length;
  }

  // Names otherwise sort alphabetically by original name.
  if (nameA == nameB) return 0;
  return nameA.name < nameB.name ? -1 : 1;
}

function _sorterOfNormStrings(a: AgentName, b: AgentName): number {
  const [normA, normB] = [a.toNormString(), b.toNormString()];
  if (normA == normB) return 0;
  return normA < normB ? -1 : 1;
}
