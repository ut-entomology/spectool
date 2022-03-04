import { containsRegionIDPairing, containsCoordinatePairing } from './excluded_matches';
import { MockExcludedMatchesStore } from './mock/mock_excluded_matches';

describe('region and coordinate containment checks', () => {
  test('region containment', () => {
    let contains = containsRegionIDPairing([], 1, 2);
    expect(contains).toBeFalsy();

    contains = containsRegionIDPairing([[1, 2]], 1, 2);
    expect(contains).toBeTruthy();

    contains = containsRegionIDPairing([[2, 1]], 1, 2);
    expect(contains).toBeTruthy();

    contains = containsRegionIDPairing([[1, 2]], 2, 1);
    expect(contains).toBeTruthy();

    // prettier-ignore
    contains = containsRegionIDPairing([[1, 2], [3, 4]], 4, 3);
    expect(contains).toBeTruthy();

    // prettier-ignore
    contains = containsRegionIDPairing([[1, 2], [3, 4]], 4, 5);
    expect(contains).toBeFalsy();
  });

  test('coordinate containment', () => {
    let contains = containsCoordinatePairing([], [1, 2], [3, 4]);
    expect(contains).toBeFalsy();

    // prettier-ignore
    contains = containsCoordinatePairing([[[1, 2], [3, 4]]], [1, 2], [3, 4]);
    expect(contains).toBeTruthy();

    // prettier-ignore
    contains = containsCoordinatePairing([[[1, 2], [3, 4]]], [1, 2], [4, 3]);
    expect(contains).toBeFalsy();

    // prettier-ignore
    contains = containsCoordinatePairing([[[3, 4], [1, 2]]], [1, 2], [3, 4]);
    expect(contains).toBeTruthy();

    // prettier-ignore
    contains = containsCoordinatePairing([[[1, 2], [3, 4]]], [3, 4], [1, 2]);
    expect(contains).toBeTruthy();

    // prettier-ignore
    contains = containsCoordinatePairing(
      [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], [7, 8], [5, 6]
    );
    expect(contains).toBeTruthy();

    // prettier-ignore
    contains = containsCoordinatePairing(
      [[[1, 2], [3, 4]], [[5, 6], [7, 8]]], [7, 8], [5, 7]
    );
    expect(contains).toBeFalsy();
  });
});

describe('starting with an empty excluded words store', () => {
  const store = new MockExcludedMatchesStore();

  test('request for non-existant word series', () => {
    const exclusion = store.getExcludedMatches('some words');
    expect(exclusion).toBeNull();
  });

  test('retrieving newly added exclusion', () => {
    store.excludeWordSeriesMatch('some words', 'other words');
    const exclusion = store.getExcludedMatches('some words');
    expect(exclusion).toEqual({
      nonmatchingRegionIDPairings: [],
      nonmatchingCoordinatePairings: [],
      nonmatchingWords: ['other words']
    });
  });
});

describe('starting with a populated excluded words store', () => {
  const store = new MockExcludedMatchesStore();
  store.excludeRegionMatch('some words', 1, 2);
  store.excludeRegionMatch('some words', 3, 4);
  store.excludeRegionMatch('other words', 5, 6);
  store.excludeCoordinateMatch('some words', [1, 2], [3, 4]);
  store.excludeCoordinateMatch('some words', [5, 6], [7, 8]);
  store.excludeCoordinateMatch('some words', [5, 6], [8, 9]);
  store.excludeCoordinateMatch('some words', [8, 9], [1, 2]);
  store.excludeCoordinateMatch('other words', [1, 2], [8, 9]);
  store.excludeWordSeriesMatch('other words', 'foo bar');
  store.excludeWordSeriesMatch('some words', 'some words');
  store.excludeWordSeriesMatch('some words', 'other words');

  test('first added word series', () => {
    const exclusion = store.getExcludedMatches('some words');
    expect(exclusion).toEqual({
      // prettier-ignore
      nonmatchingRegionIDPairings: [[1, 2], [3, 4]],
      // prettier-ignore
      nonmatchingCoordinatePairings: [
        [[1, 2], [3, 4]],
        [[5, 6], [7, 8]],
        [[5, 6], [8, 9]],
        [[8, 9], [1, 2]]
      ],
      nonmatchingWords: ['some words', 'other words']
    });
  });

  test('second added word series', () => {
    const exclusion = store.getExcludedMatches('other words');
    expect(exclusion).toEqual({
      nonmatchingRegionIDPairings: [[5, 6]],
      // prettier-ignore
      nonmatchingCoordinatePairings: [[[1, 2], [8, 9]]],
      nonmatchingWords: ['foo bar', 'some words']
    });
  });

  test('reciprical word series', () => {
    const exclusion = store.getExcludedMatches('foo bar');
    expect(exclusion).toEqual({
      nonmatchingRegionIDPairings: [],
      nonmatchingCoordinatePairings: [],
      nonmatchingWords: ['other words']
    });
  });
});
