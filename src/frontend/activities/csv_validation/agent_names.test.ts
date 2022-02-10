import assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';

// TODO: test comparing suffixes

import {
  AgentName,
  NicknameMap,
  areSimilarNames,
  compareUntrustedNames,
  compareToTrustedNames,
  parseNicknames
} from './agent_names';

const nicknamesBuf = fs.readFileSync(
  path.join(__dirname, '../../../../public/data/nicknames.txt')
);
const nicknames = parseNicknames(nicknamesBuf.toString());
const noNicknames = {};

describe('checking for agent name similarity', () => {
  test('agent names that should be similar', () => {
    verifyMutualSimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('roy gee biv', 'RY GE BF'),
      new AgentName('r g biv iii', 'R G BF III'),
      new AgentName('r g biv III', 'R G BF III'),
      new AgentName('r g b', 'R G B')
    ]);
    verifyMutualSimilarity(noNicknames, [
      new ExactName('Roy Gee Biv'),
      new ExactName('Roy Gee Biv'),
      new ExactName('Roy Gee Biv III'),
      new ExactName('Roy Gee Biv 3rd'),
      new ExactName('R Gee Biv'),
      new ExactName('Roy G Biv'),
      new ExactName('R G Biv'),
      new ExactName('G Biv'),
      new ExactName('Biv'),
      new ExactName('Roy G B'),
      new ExactName('R Gee B'),
      new ExactName('Gee B'),
      new ExactName('R G B'),
      new ExactName('R G *'),
      new ExactName('Gee *')
    ]);
    verifyMutualSimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('Roy Gee Biv III', 'RY GE BF I'),
      new AgentName('Roy Gee Biv 3rd', 'RY GE BF 3RD'),
      new AgentName('R Gee Biv', 'R GE BF'),
      new AgentName('Roy G Biv', 'RY G BF'),
      new AgentName('R G Biv', 'R G BF'),
      new AgentName('G Biv', 'G BF'),
      new AgentName('Biv', 'BF'),
      new AgentName('Roy G B', 'RY G B'),
      new AgentName('R Gee B', 'RY GE B'),
      new AgentName('Gee B', 'GE B'),
      new AgentName('R G B', 'R G B'),
      new AgentName('R G *', 'R G *'),
      new AgentName('Gee *', 'GE *')
    ]);
    verifyMutualSimilarity(noNicknames, [
      new ExactName('Roy Gee Biv'),
      new ExactName('Roy Gee Biv Sr'),
      new ExactName('Roy Gee Biv Sr'),
      new ExactName('R Gee Biv'),
      new ExactName('Roy G Biv'),
      new ExactName('R G Biv'),
      new ExactName('R Biv'),
      new ExactName('Biv'),
      new ExactName('Roy G B'),
      new ExactName('R Gee B'),
      new ExactName('Roy B'),
      new ExactName('R G B'),
      new ExactName('R G *'),
      new ExactName('Roy *')
    ]);
    verifyMutualSimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('Roy Gee Biv Sr', 'RY GE BF SR'),
      new AgentName('Roy Gee Biv Sr', 'RY GE BF SR'),
      new AgentName('R Gee Biv', 'R GE BF'),
      new AgentName('Roy G Biv', 'RY G BF'),
      new AgentName('R G Biv', 'R G BF'),
      new AgentName('R Biv', 'R BF'),
      new AgentName('Biv', 'BF'),
      new AgentName('Roy G B', 'RY G B'),
      new AgentName('R Gee B', 'R GE B'),
      new AgentName('Roy B', 'RY B'),
      new AgentName('R G B', 'R G B'),
      new AgentName('R G *', 'R G *'),
      new AgentName('Roy *', 'RY *')
    ]);
    verifyMutualSimilarity(noNicknames, [
      new ExactName('Roy Gee Biv'),
      new ExactName('Roy Biv II'),
      new ExactName('R Biv 2nd')
    ]);
    verifyMutualSimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('Roy Biv II', 'RY BF II'), // HERE
      new AgentName('R Biv 2nd', 'RY BF 2ND'),
      new AgentName('Roy Gi Biv', 'RY GE BF'),
      new AgentName('Roi Gi Biv', 'RY GE BF'),
      new AgentName('R G Biv', 'R G BF'), // HERE
      new AgentName('Roi G Biv', 'RY G BF'),
      new AgentName('R Gi Biv', 'R GE BF')
    ]);
  });

  test('agent names with equivalent nicknames', () => {
    verifyMutualSimilarity(nicknames, [
      new AgentName('Joe Biv', 'JO BF'),
      new AgentName('Joe *', 'JO *'),
      new AgentName('Joey Biv', 'JY BF'),
      new AgentName('joey Biv', 'JY BF'),
      new AgentName('Joseph Biv', 'JSF BF')
    ]);
    verifyMutualSimilarity(nicknames, [
      new AgentName('Jody Biv', 'JDY BF'),
      new AgentName('jody Biv', 'JDY BF'),
      new AgentName('Jo Biv', 'Jo BF')
    ]);
    verifyMutualSimilarity(nicknames, [
      new AgentName('Jo Biv', 'JO BF'),
      new AgentName('jo Biv', 'JO BF'),
      new AgentName('Jody Biv', 'JDY BF')
    ]);
  });

  test('agent names that should NOT be similar', () => {
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('Biv'),
      new ExactName('Black')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('R Biv'),
      new ExactName('R Black')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('Roy Gee Biv'),
      new ExactName('Red Green Biv'),
      new ExactName('Red Green Blue'),
      new ExactName('R G Black'),
      new ExactName('Fred')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('Red Green Biv', 'RD GN BF'),
      new AgentName('Red Green Blue', 'RD GN BL'),
      new AgentName('R G Black', 'R G BK'),
      new AgentName('Fred', 'FD')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('Roy Gee Biv'),
      new ExactName('Gee Roy Biv'),
      new ExactName('Biv Roy Gee'),
      new ExactName('Rose *')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('Gee Roy Biv', 'GE RY BF'),
      new AgentName('Biv Roy Gee', 'BF RY GE'),
      new AgentName('Rose *', 'RS *')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('Roy Gee Biv'),
      new ExactName('G R Biv'),
      new ExactName('Biv R G')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Roy Gee Biv', 'RY GE BF'),
      new AgentName('G R Biv', 'G R BF'),
      new AgentName('Biv R G', 'BF R G')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('Roy Gee Biv II'),
      new ExactName('Roy Gee Biv III'),
      new ExactName('Roy Gee Biv Jr')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Roy Gee Biv II', 'RY GE BF II'),
      new AgentName('Roy Gee Biv III', 'RY GE BF III'),
      new AgentName('Roy Gee Biv Jr', 'RY GE BF JR')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new ExactName('Rose *'),
      new ExactName('Roy *')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Rose *', 'RS *'),
      new AgentName('Roy *', 'RY *')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Roy Rose Biv', 'RY RS BF'),
      new AgentName('R Roy Biv', 'R RY BF'),
      new AgentName('R R Black', 'R R BK')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Roy Rose Biv', 'RY RS BF'),
      new AgentName('Rose R Biv', 'RS R BF'),
      new AgentName('R R Black', 'R R BK')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('B Biv', 'B BF'),
      new AgentName('B Black', 'B BK')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Blue Biv', 'BU BF'),
      new AgentName('B Black', 'B BK'),
      new AgentName('Black Biv', 'BK BF')
    ]);
    verifyMutualDissimilarity(noNicknames, [
      new AgentName('Blue Beard Biv', 'BU BD BF'),
      new AgentName('Blue B Black', 'BU B BK'),
      new AgentName('B Black Biv', 'B BK BF')
    ]);
  });

  test("last names can't have nicknames", () => {
    verifyMutualDissimilarity(nicknames, [
      new AgentName('Billy Joe', 'BY JO'),
      new AgentName('Billy Joey', 'BY JY'),
      new AgentName('Billy Joseph', 'BY JSF')
    ]);
    verifyMutualDissimilarity(nicknames, [
      new AgentName('Billy Jody', 'BY JDY'),
      new AgentName('Billy Jo', 'BY JO')
    ]);
    verifyMutualDissimilarity(nicknames, [
      new AgentName('Billy Jo', 'BY JO'),
      new AgentName('Billy Jody', 'BY JDY')
    ]);
  });
});

describe('comparing trusted and untrusted names', () => {
  test('all untrusted names identical to trusted names', () => {
    const groups = compareToTrustedNames(
      noNicknames,
      groupByLastName([new ExactName('Sue Rex'), new ExactName('Jeff Boo')]),
      groupByLastName([new ExactName('Jeff Boo'), new ExactName('Sue Rex')])
    );
    assert.deepEqual(groups, []);
  });

  test('no similar untrusted names', () => {
    const groups = compareToTrustedNames(
      noNicknames,
      groupByLastName([new ExactName('Sue Rex'), new ExactName('Jeff Boo')]),
      groupByLastName([
        new ExactName('Jeff Boop'),
        new ExactName('Sue Rice'),
        new ExactName('Shoe Rex'),
        new ExactName('Jiff Boo')
      ])
    );
    assert.deepEqual(groups, []);
  });

  test('some similar untrusted names', () => {
    const groups = compareToTrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Sue Rex'),
        new ExactName('Jeff Boo'),
        new ExactName('Fred Foo')
      ]),
      groupByLastName([
        new ExactName('Fred Foo'),
        new ExactName('Jeff Boop'),
        new ExactName('Sam Fred Foo'),
        new ExactName('S F Foo'),
        new ExactName('S Rex'),
        new ExactName('Jiff Boo'),
        new ExactName('Rex')
      ])
    );
    assert.deepEqual(groups, [
      [
        new ExactName('Fred Foo'),
        new ExactName('Sam Fred Foo'),
        new ExactName('S F Foo')
      ],
      [new ExactName('Sue Rex'), new ExactName('S Rex'), new ExactName('Rex')]
    ]);
  });

  test('trusted names with missing last names', () => {
    const groups = compareToTrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Sue Rex'),
        new ExactName('Jeff *'),
        new ExactName('Fred S *'),
        new ExactName('Stan *'),
        new ExactName('Ziggy *')
      ]),
      groupByLastName([
        new ExactName('Fred Foo'),
        new ExactName('Jeff Boop'),
        new ExactName('Sam Fred Foo'),
        new ExactName('Fred Sam Foo'),
        new ExactName('J Smith'),
        new ExactName('F S Foo'),
        new ExactName('S Rex'),
        new ExactName('Jiff Boo'),
        new ExactName('Smith')
      ])
    );
    assert.deepEqual(groups, [
      [
        new ExactName('Fred S *'),
        new ExactName('Fred Sam Foo'),
        new ExactName('F S Foo'),
        new ExactName('Fred Foo'),
        new ExactName('S Rex'),
        new ExactName('Smith')
      ],
      [
        new ExactName('Jeff *'),
        new ExactName('Jeff Boop'),
        new ExactName('J Smith'),
        new ExactName('Smith')
      ],
      [
        new ExactName('Stan *'),
        new ExactName('F S Foo'),
        new ExactName('S Rex'),
        new ExactName('Smith')
      ],
      [new ExactName('Ziggy *'), new ExactName('Smith')],
      [new ExactName('Sue Rex'), new ExactName('S Rex')]
    ]);
  });

  test('untrusted names with missing last names', () => {
    const groups = compareToTrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Fred *'),
        new ExactName('Fred Smith'),
        new ExactName('Jeff Boop'),
        new ExactName('J Rex')
      ]),
      groupByLastName([
        new ExactName('Alex *'),
        new ExactName('Fred *'),
        new ExactName('F S *'),
        new ExactName('Jeff *'),
        new ExactName('J S *'),
        new ExactName('S J *')
      ])
    );
    assert.deepEqual(groups, [
      [new ExactName('Fred *'), new ExactName('F S *')],
      [
        new ExactName('Jeff Boop'),
        new ExactName('J S *'),
        new ExactName('S J *'),
        new ExactName('Jeff *')
      ],
      [
        new ExactName('J Rex'),
        new ExactName('J S *'),
        new ExactName('S J *'),
        new ExactName('Jeff *')
      ],
      [new ExactName('Fred Smith'), new ExactName('F S *'), new ExactName('Fred *')]
    ]);
  });

  test('trusted and untrusted name suffixes', () => {
    const groups = compareToTrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Fred Foo Shoe'),
        new ExactName('Fred Foo III'),
        new ExactName('Fred Foo'),
        new ExactName('Sam Good'),
        new ExactName('Sam Good Sr')
      ]),
      groupByLastName([
        new ExactName('Foo III'),
        new ExactName('Fred Foo 3rd'),
        new ExactName('Fred Foo II'),
        new ExactName('Sam Good'),
        new ExactName('F Foo'),
        new ExactName('Fred Foo III'),
        new ExactName('Fred Foo Shoe'),
        new ExactName('Sam Good Jr'),
        new ExactName('Sam Good Sr'),
        new ExactName('Fred Foo 2nd'),
        new ExactName('Foo'),
        new ExactName('Fred Foo')
      ])
    );
    assert.deepEqual(groups, [
      [
        new ExactName('Fred Foo'),
        new ExactName('Fred Foo 2nd'),
        new ExactName('Fred Foo 3rd'),
        new ExactName('Fred Foo III'),
        new ExactName('Fred Foo II'),
        new ExactName('F Foo'),
        new ExactName('Foo III'),
        new ExactName('Foo')
      ],
      [
        new ExactName('Fred Foo III'),
        new ExactName('Fred Foo 3rd'),
        new ExactName('Fred Foo'),
        new ExactName('F Foo'),
        new ExactName('Foo III'),
        new ExactName('Foo')
      ],
      [
        new ExactName('Sam Good'),
        new ExactName('Sam Good Jr'),
        new ExactName('Sam Good Sr')
      ],
      [new ExactName('Sam Good Sr'), new ExactName('Sam Good')]
    ]);
  });
});

describe('comparing untrusted names with one another', () => {
  test('no similar names', () => {
    const groups = compareUntrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Sue Rex'),
        new ExactName('Jeff Boo'),
        new ExactName('X Boo')
      ])
    );
    assert.deepEqual(groups, []);
  });

  test('similar names, all last names known', () => {
    const groups = compareUntrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Sue Rex'),
        new ExactName('Jeff Boo'),
        new ExactName('J Boo'),
        new ExactName('J T Boo'),
        new ExactName('James T Boo'),
        new ExactName('Rex'),
        new ExactName('S Q Rex'),
        new ExactName('Q S Rex'),
        new ExactName('Sue Boo')
      ])
    );
    assert.deepEqual(groups, [
      [new ExactName('J T Boo'), new ExactName('Jeff Boo'), new ExactName('J Boo')],
      [new ExactName('James T Boo'), new ExactName('J T Boo'), new ExactName('J Boo')],
      [new ExactName('Q S Rex'), new ExactName('Sue Rex'), new ExactName('Rex')],
      [new ExactName('S Q Rex'), new ExactName('Sue Rex'), new ExactName('Rex')]
    ]);
  });

  test('similar names, some unknown last names', () => {
    const groups = compareUntrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Jeff *'),
        new ExactName('S T *'),
        new ExactName('S Tommie *'),
        new ExactName('J S Foo'),
        new ExactName('Foo'),
        new ExactName('Jeff Rex'),
        new ExactName('Jeff Boo'),
        new ExactName('J *'),
        new ExactName('Sue T Rex')
      ])
    );
    assert.deepEqual(groups, [
      [new ExactName('Jeff Boo'), new ExactName('Jeff *'), new ExactName('J *')],
      [
        new ExactName('Foo'),
        new ExactName('S Tommie *'),
        new ExactName('S T *'),
        new ExactName('Jeff *'),
        new ExactName('J *')
      ],
      [
        new ExactName('J S Foo'),
        new ExactName('Foo'),
        new ExactName('Jeff *'),
        new ExactName('J *')
      ],
      [new ExactName('Jeff Rex'), new ExactName('Jeff *'), new ExactName('J *')],
      [new ExactName('Sue T Rex'), new ExactName('S Tommie *'), new ExactName('S T *')]
    ]);
  });

  test('similar names, only unknown last names', () => {
    const groups = compareUntrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Jeff *'),
        new ExactName('S T *'),
        new ExactName('S Tommie *'),
        new ExactName('J *')
      ])
    );
    assert.deepEqual(groups, [
      [new ExactName('Jeff *'), new ExactName('J *')],
      [new ExactName('S Tommie *'), new ExactName('S T *')]
    ]);
  });

  test('similar names, some with suffixes', () => {
    const groups = compareUntrustedNames(
      noNicknames,
      groupByLastName([
        new ExactName('Foo III'),
        new ExactName('Fred Foo 3rd'),
        new ExactName('Fred Foo II'),
        new ExactName('Sam Good'),
        new ExactName('F Foo'),
        new ExactName('Fred Foo III'),
        new ExactName('Fred Foo Shoe'),
        new ExactName('Sam Good Jr'),
        new ExactName('Sam Good Sr'),
        new ExactName('Fred Foo 2nd'),
        new ExactName('Foo'),
        new ExactName('Fred Foo')
      ])
    );
    assert.deepEqual(groups, [
      [
        new ExactName('Fred Foo 2nd'),
        new ExactName('Fred Foo II'),
        new ExactName('Fred Foo'),
        new ExactName('F Foo'),
        new ExactName('Foo')
      ],
      [
        new ExactName('Fred Foo 3rd'),
        new ExactName('Fred Foo III'),
        new ExactName('Fred Foo'),
        new ExactName('F Foo'),
        new ExactName('Foo III'),
        new ExactName('Foo')
      ],
      [new ExactName('Sam Good Jr'), new ExactName('Sam Good')],
      [new ExactName('Sam Good Sr'), new ExactName('Sam Good')]
    ]);
  });
});

class ExactName extends AgentName {
  constructor(name: string) {
    super(name, name);
  }
}

function groupByLastName(names: AgentName[]): Record<string, AgentName[]> {
  const groupMap: Record<string, AgentName[]> = {};
  for (const name of names) {
    let lastName = name.words[name.words.length - 1];
    let group = groupMap[lastName];
    if (!group) {
      group = [];
      groupMap[lastName] = group;
    }
    group.push(name);
  }
  return groupMap;
}

// function showGroups(groups: AgentName[][]) {
//   console.log(JSON.stringify(groups, undefined, '  '));
// }

function verifyMutualDissimilarity(nicknameMap: NicknameMap, names: AgentName[]) {
  for (let i = 0; i < names.length - 1; ++i) {
    for (let j = i + 1; j < names.length; ++j) {
      assert(
        !areSimilarNames(nicknameMap, names[i], names[j]),
        `'${names[i]}' vs. '${names[j]}'`
      );
    }
  }
}

function verifyMutualSimilarity(nicknameMap: NicknameMap, names: AgentName[]) {
  for (let i = 0; i < names.length - 1; ++i) {
    for (let j = i + 1; j < names.length; ++j) {
      assert(
        areSimilarNames(nicknameMap, names[i], names[j]),
        `'${names[i]}' vs. '${names[j]}'`
      );
    }
  }
}
