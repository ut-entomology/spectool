import assert from 'assert';

import { AgentName, areSimilarNames } from './agent_names';

test('agent names that should be similar', () => {
  verifyMutualSimilarity([
    new AgentName('Roy Gee Biv', 'RY GE BF'),
    new AgentName('roy gee biv', 'RY GE BF'),
    new AgentName('r g biv iii', 'R G BF III'),
    new AgentName('r g biv III', 'R G BF III'),
    new AgentName('r g b', 'R G B')
  ]);
  verifyMutualSimilarity([
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
  verifyMutualSimilarity([
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
  verifyMutualSimilarity([
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
  verifyMutualSimilarity([
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
  verifyMutualSimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('Roy Biv II'),
    new ExactName('R Biv 2nd')
  ]);
  verifyMutualSimilarity([
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

test('agent names that should NOT be similar', () => {
  verifyMutualDissimilarity([new ExactName('Biv'), new ExactName('Black')]);
  verifyMutualDissimilarity([new ExactName('R Biv'), new ExactName('R Black')]);
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('Red Green Biv'),
    new ExactName('Red Green Blue'),
    new ExactName('R G Black'),
    new ExactName('Fred')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Roy Gee Biv', 'RY GE BF'),
    new AgentName('Red Green Biv', 'RD GN BF'),
    new AgentName('Red Green Blue', 'RD GN BL'),
    new AgentName('R G Black', 'R G BK'),
    new AgentName('Fred', 'FD')
  ]);
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('Gee Roy Biv'),
    new ExactName('Biv Roy Gee'),
    new ExactName('Rose *')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Roy Gee Biv', 'RY GE BF'),
    new AgentName('Gee Roy Biv', 'GE RY BF'),
    new AgentName('Biv Roy Gee', 'BF RY GE'),
    new AgentName('Rose *', 'RS *')
  ]);
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('G R Biv'),
    new ExactName('Biv R G')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Roy Gee Biv', 'RY GE BF'),
    new AgentName('G R Biv', 'G R BF'),
    new AgentName('Biv R G', 'BF R G')
  ]);
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv II'),
    new ExactName('Roy Gee Biv III'),
    new ExactName('Roy Gee Biv Jr')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Roy Gee Biv II', 'RY GE BF II'),
    new AgentName('Roy Gee Biv III', 'RY GE BF III'),
    new AgentName('Roy Gee Biv Jr', 'RY GE BF JR')
  ]);
  verifyMutualDissimilarity([new ExactName('Rose *'), new ExactName('Roy *')]);
  verifyMutualDissimilarity([
    new AgentName('Rose *', 'RS *'),
    new AgentName('Roy *', 'RY *')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Roy Rose Biv', 'RY RS BF'),
    new AgentName('R Roy Biv', 'R RY BF'),
    new AgentName('R R Black', 'R R BK')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Roy Rose Biv', 'RY RS BF'),
    new AgentName('Rose R Biv', 'RS R BF'),
    new AgentName('R R Black', 'R R BK')
  ]);
  verifyMutualDissimilarity([
    new AgentName('B Biv', 'B BF'),
    new AgentName('B Black', 'B BK')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Blue Biv', 'BU BF'),
    new AgentName('B Black', 'B BK'),
    new AgentName('Black Biv', 'BK BF')
  ]);
  verifyMutualDissimilarity([
    new AgentName('Blue Beard Biv', 'BU BD BF'),
    new AgentName('Blue B Black', 'BU B BK'),
    new AgentName('B Black Biv', 'B BK BF')
  ]);
});

class ExactName extends AgentName {
  constructor(name: string) {
    super(name, name);
  }
}

function verifyMutualDissimilarity(names: AgentName[]) {
  for (let i = 0; i < names.length - 1; ++i) {
    for (let j = i + 1; j < names.length; ++j) {
      assert(!areSimilarNames(names[i], names[j]), `'${names[i]}' vs. '${names[j]}'`);
    }
  }
}

function verifyMutualSimilarity(names: AgentName[]) {
  for (let i = 0; i < names.length - 1; ++i) {
    for (let j = i + 1; j < names.length; ++j) {
      assert(areSimilarNames(names[i], names[j]), `'${names[i]}' vs. '${names[j]}'`);
    }
  }
}
