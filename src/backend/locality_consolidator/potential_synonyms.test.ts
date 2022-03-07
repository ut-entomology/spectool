import type { PhoneticCodeIndex } from './phonetic_code_index';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';
import { MockPotentialSynonymsStore } from './mock/mock_potential_synonyms';

const synFoo = {
  originalWordSeries: 'Foo',
  phoneticSeries: 'F'
};
const synBar = {
  originalWordSeries: 'Bar',
  phoneticSeries: 'B'
};
const synZoo = {
  originalWordSeries: 'Zoo',
  phoneticSeries: 'Z'
};
const synYikes = {
  originalWordSeries: 'Yikes',
  phoneticSeries: 'Y'
};
const synGuppy = {
  originalWordSeries: 'Guppy',
  phoneticSeries: 'G'
};

test("getting phonetic synonyms that aren't there", () => {
  const store = new MockPotentialSynonymsStore(new MockPhoneticCodeIndex());

  expect(store.getSynonymousSeries('F')).toBeNull();

  store.addSynonym(synFoo, synBar);
  expect(store.getSynonymousSeries('Z')).toBeNull();
});

test('adding and removing phonetic synonyms', () => {
  const store = new MockPotentialSynonymsStore(new MockPhoneticCodeIndex());

  // Gradually add synonyms.

  store.addSynonym(synFoo, synBar);
  expect(store.getSynonymousSeries('F')).toEqual(['B']);
  expect(store.getSynonymousSeries('B')).toEqual(['F']);

  store.addSynonym(synFoo, synBar); // adding again should change nothing
  expect(store.getSynonymousSeries('B')).toEqual(['F']);
  expect(store.getSynonymousSeries('F')).toEqual(['B']);

  store.addSynonym(synBar, synZoo);
  expect(store.getSynonymousSeries('B')).toEqual(['F', 'Z']);
  expect(store.getSynonymousSeries('Z')).toEqual(['B', 'F']);

  store.addSynonym(synYikes, synGuppy);
  expect(store.getSynonymousSeries('Y')).toEqual(['G']);
  expect(store.getSynonymousSeries('G')).toEqual(['Y']);

  store.addSynonym(synYikes, synBar);
  expect(store.getSynonymousSeries('Y')).toEqual(['G', 'B', 'F', 'Z']);
  expect(store.getSynonymousSeries('B')).toEqual(['F', 'Z', 'Y', 'G']);

  // Removing synonyms in reverse order should reproduce above results.

  store.removeSynonym(synYikes, synBar);
  expect(store.getSynonymousSeries('Y')).toEqual(['G']);
  expect(store.getSynonymousSeries('G')).toEqual(['Y']);
  expect(store.getSynonymousSeries('B')).toEqual(['F', 'Z']);
  expect(store.getSynonymousSeries('Z')).toEqual(['B', 'F']);

  store.removeSynonym(synGuppy, synYikes);
  expect(store.getSynonymousSeries('Y')).toBeNull();
  expect(store.getSynonymousSeries('G')).toBeNull();

  store.removeSynonym(synZoo, synBar);
  expect(store.getSynonymousSeries('B')).toEqual(['F']);
  expect(store.getSynonymousSeries('F')).toEqual(['B']);
  expect(store.getSynonymousSeries('Z')).toBeNull();

  store.removeSynonym(synBar, synZoo); // removing again should change nothing
  expect(store.getSynonymousSeries('B')).toEqual(['F']);
  expect(store.getSynonymousSeries('F')).toEqual(['B']);
  expect(store.getSynonymousSeries('Z')).toBeNull();

  store.removeSynonym(synFoo, synBar);
  expect(store.getSynonymousSeries('F')).toBeNull();
  expect(store.getSynonymousSeries('B')).toBeNull();
});

test('indexing of phonetic synonyms by phonetic code', async () => {
  const phoneticCodeIndex = new MockPhoneticCodeIndex();
  const store = new MockPotentialSynonymsStore(phoneticCodeIndex);

  const syn1a = {
    originalWordSeries: 'Foo Bar',
    phoneticSeries: 'BR FO'
  };
  const syn1b = {
    originalWordSeries: 'FB',
    phoneticSeries: 'FB'
  };
  const syn2a = {
    originalWordSeries: 'Yay Baz',
    phoneticSeries: 'BZ YY'
  };
  const syn2b = {
    originalWordSeries: 'BB',
    phoneticSeries: 'BB'
  };
  const syn3a = {
    originalWordSeries: 'Foo Bar Baz',
    phoneticSeries: 'BR BZ FO'
  };
  const syn3b = {
    originalWordSeries: 'Foo BZ',
    phoneticSeries: 'FO BZ'
  };

  // Gradually add synonyms.

  verifyIndexes(phoneticCodeIndex, {});

  store.addSynonym(syn1a, syn1b);
  verifyIndexes(phoneticCodeIndex, {
    BR: ['BR FO'],
    FB: ['FB'],
    FO: ['BR FO']
  });

  store.addSynonym(syn1a, syn1b); // adding again should change nothing
  verifyIndexes(phoneticCodeIndex, {
    BR: ['BR FO'],
    FB: ['FB'],
    FO: ['BR FO']
  });

  store.addSynonym(syn2a, syn2b);
  verifyIndexes(phoneticCodeIndex, {
    BB: ['BB'],
    BR: ['BR FO'],
    BZ: ['BZ YY'],
    FB: ['FB'],
    FO: ['BR FO'],
    YY: ['BZ YY']
  });

  store.addSynonym(syn3b, syn3a);
  verifyIndexes(phoneticCodeIndex, {
    BB: ['BB'],
    BR: ['BR FO', 'BR BZ FO'],
    BZ: ['BZ YY', 'BR BZ FO', 'FO BZ'],
    FB: ['FB'],
    FO: ['BR FO', 'BR BZ FO', 'FO BZ'],
    YY: ['BZ YY']
  });

  // Removing synonyms in reverse order should reproduce above results.

  store.removeSynonym(syn3a, syn3b); // swapped order adding the pair
  verifyIndexes(phoneticCodeIndex, {
    BB: ['BB'],
    BR: ['BR FO'],
    BZ: ['BZ YY'],
    FB: ['FB'],
    FO: ['BR FO'],
    YY: ['BZ YY']
  });

  store.removeSynonym(syn2a, syn2b);
  verifyIndexes(phoneticCodeIndex, {
    BR: ['BR FO'],
    FB: ['FB'],
    FO: ['BR FO']
  });

  store.removeSynonym(syn1a, syn1b);
  verifyIndexes(phoneticCodeIndex, {});
});

async function verifyIndexes(
  phoneticCodeIndex: PhoneticCodeIndex,
  indexes: Record<string, string[]>
): Promise<void> {
  for (const [code, expectedSeriesList] of Object.entries(indexes)) {
    const actualSeriesList =
      (await phoneticCodeIndex.getPhoneticSeriesSynonyms(code)) || [];
    for (const series of expectedSeriesList) {
      expect(actualSeriesList).toContain(series);
    }
    for (const series of actualSeriesList) {
      expect(expectedSeriesList).toContain(series);
    }
  }
}
