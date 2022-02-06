import assert from 'assert';

import { AgentName, areSimilarNames } from './agent_names';

test('agent names that should be similar', () => {
  verifyMutualSimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('Roy Gee Biv III'),
    new ExactName('Roy Gee Biv Jr'),
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
    new AgentName('Roy Gee Biv Jr', 'RY GE BF JR'),
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
    new ExactName('Roy Gee Biv 1st'),
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
    new AgentName('Roy Gee Biv 1st'),
    new AgentName('Roy Gee Biv Sr'),
    new AgentName('R Gee Biv'),
    new AgentName('Roy G Biv'),
    new AgentName('R G Biv'),
    new AgentName('R Biv'),
    new AgentName('Biv'),
    new AgentName('Roy G B'),
    new AgentName('R Gee B'),
    new AgentName('Roy B'),
    new AgentName('R G B'),
    new AgentName('R G *'),
    new AgentName('Roy *')
  ]);
});

test('agent names that should NOT be similar', () => {
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('Red Green Biv'),
    new ExactName('Red Green Blue'),
    new ExactName('R G Black'),
    new ExactName('Fred')
  ]);
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('Gee Roy Biv'),
    new ExactName('Biv Roy Gee'),
    new ExactName('Rose *')
  ]);
  verifyMutualDissimilarity([
    new ExactName('Roy Gee Biv'),
    new ExactName('G R Biv'),
    new ExactName('Biv R G')
  ]);
  verifyMutualDissimilarity([new ExactName('Rose *'), new ExactName('Roy *')]);
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
