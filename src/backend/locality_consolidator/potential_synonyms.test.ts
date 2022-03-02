import { StoredSynonym, PotentialSynonymsStore } from './potential_synonyms';

class PotentialSynonymsTestStore extends PotentialSynonymsStore {
  private _synonymsByPhoneticSeries: Record<string, StoredSynonym[]> = {};

  protected _getSynonymList(phoneticSeries: string): StoredSynonym[] | null {
    return this._synonymsByPhoneticSeries[phoneticSeries] || null;
  }

  protected _setSynonymList(phoneticSeries: string, synonyms: StoredSynonym[]): void {
    this._synonymsByPhoneticSeries[phoneticSeries] = synonyms;
  }
}

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
  const store = new PotentialSynonymsTestStore();

  expect(store.getSynonymousSeries('F')).toBeNull();

  store.addSynonym(synFoo, synBar);
  expect(store.getSynonymousSeries('Z')).toBeNull();
});

test('adding and removing phonetic synonyms', () => {
  const store = new PotentialSynonymsTestStore();

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
