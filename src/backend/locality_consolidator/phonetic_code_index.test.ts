import { CachedLocality } from './cached_locality';
import { TrackedRegion } from './tracked_region';
import { Region, RegionRank } from '../../shared/shared_geography';
import { MockPhoneticCodeIndex } from './mock/mock_phonetic_code_index';

describe('indexing localities by phonetic code', () => {
  const codeIndex = new MockPhoneticCodeIndex();
  const region = new Region(999, RegionRank.County, 'Travis County', 32);
  const trackedRegion = new TrackedRegion(region, true);

  const locality1 = new CachedLocality({
    regionID: trackedRegion.id,
    localityID: 30,
    latitude: null,
    longitude: null,
    name: 'Austin',
    remarks: '',
    lastModified: Date.now()
  });
  const locality2 = new CachedLocality({
    regionID: trackedRegion.id,
    localityID: 40,
    latitude: null,
    longitude: null,
    name: 'Zilker Preserve',
    remarks: '',
    lastModified: Date.now()
  });
  const locality3 = new CachedLocality({
    regionID: trackedRegion.id,
    localityID: 50,
    latitude: null,
    longitude: null,
    name: 'Bright Leaf Preserve',
    remarks: '',
    lastModified: Date.now()
  });
  const locality4 = new CachedLocality({
    regionID: trackedRegion.id,
    localityID: 50,
    latitude: null,
    longitude: null,
    name: 'The Great Great Park',
    remarks: '',
    lastModified: Date.now()
  });

  test('retrieving empty index', async () => {
    const ids = await codeIndex.getLocalityIDs('missing');
    expect(ids).toBeNull();
  });

  test('adding localities', async () => {
    await codeIndex.addLocality(locality1);
    let ids = await codeIndex.getLocalityIDs(locality1.phoneticCodes![0]);
    expect(ids).toEqual([locality1.localityID]);

    // Make sure adding again doesn't change anything.
    await codeIndex.addLocality(locality1);
    ids = await codeIndex.getLocalityIDs(locality1.phoneticCodes![0]);
    expect(ids).toEqual([locality1.localityID]);

    await codeIndex.addLocality(locality2);
    ids = await codeIndex.getLocalityIDs(locality2.phoneticCodes![0]);
    expect(ids).toEqual([locality2.localityID]);
    ids = await codeIndex.getLocalityIDs(locality2.phoneticCodes![1]);
    expect(ids).toEqual([locality2.localityID]);
    ids = await codeIndex.getLocalityIDs(locality1.phoneticCodes![0]);
    expect(ids).toEqual([locality1.localityID]);

    await codeIndex.addLocality(locality3);
    ids = await codeIndex.getLocalityIDs(locality3.phoneticCodes![0]);
    expect(ids).toEqual([locality3.localityID]);
    ids = await codeIndex.getLocalityIDs(locality3.phoneticCodes![1]);
    expect(ids).toEqual([locality3.localityID]);
    ids = await codeIndex.getLocalityIDs(locality3.phoneticCodes![2]);
    expect(ids).toEqual([locality2.localityID, locality3.localityID]);
    ids = await codeIndex.getLocalityIDs(locality2.phoneticCodes![0]);
    expect(ids).toEqual([locality2.localityID]);
    ids = await codeIndex.getLocalityIDs(locality1.phoneticCodes![0]);
    expect(ids).toEqual([locality1.localityID]);

    await codeIndex.addLocality(locality4);
    ids = await codeIndex.getLocalityIDs(locality4.phoneticCodes![0]);
    expect(ids).toEqual([locality4.localityID]);
    ids = await codeIndex.getLocalityIDs(locality4.phoneticCodes![1]);
    expect(ids).toEqual([locality4.localityID]);
    ids = await codeIndex.getLocalityIDs(locality4.phoneticCodes![2]);
    expect(ids).toEqual([locality4.localityID]);
  });

  // depends on prior test having run
  test('removing localities', async () => {
    await codeIndex.removeLocality(locality3);
    let ids = await codeIndex.getLocalityIDs(locality3.phoneticCodes![0]);
    expect(ids).toBeNull();
    ids = await codeIndex.getLocalityIDs(locality3.phoneticCodes![1]);
    expect(ids).toBeNull();
    ids = await codeIndex.getLocalityIDs(locality3.phoneticCodes![2]);
    expect(ids).toEqual([locality2.localityID]);
    ids = await codeIndex.getLocalityIDs(locality2.phoneticCodes![0]);
    expect(ids).toEqual([locality2.localityID]);
    ids = await codeIndex.getLocalityIDs(locality1.phoneticCodes![0]);
    expect(ids).toEqual([locality1.localityID]);

    await codeIndex.removeLocality(locality2);
    ids = await codeIndex.getLocalityIDs(locality2.phoneticCodes![0]);
    expect(ids).toBeNull();
    ids = await codeIndex.getLocalityIDs(locality2.phoneticCodes![1]);
    expect(ids).toBeNull();
    ids = await codeIndex.getLocalityIDs(locality1.phoneticCodes![0]);
    expect(ids).toEqual([locality1.localityID]);

    await codeIndex.removeLocality(locality4);
    ids = await codeIndex.getLocalityIDs(locality4.phoneticCodes![0]);
    expect(ids).toBeNull();
    ids = await codeIndex.getLocalityIDs(locality4.phoneticCodes![1]);
    expect(ids).toBeNull();
    ids = await codeIndex.getLocalityIDs(locality4.phoneticCodes![2]);
    expect(ids).toBeNull();
  });
});

describe('indexing phonetic series by phonetic code', () => {
  const codeIndex = new MockPhoneticCodeIndex();

  test('retrieving empty index', async () => {
    const series = await codeIndex.getPhoneticSeriesSynonyms('missing');
    expect(series).toBeNull();
  });
  const series1 = 'boo';
  const series2 = 'boo hoo';
  const series3 = 'boo hoo hoo';

  test('adding phonetic series', async () => {
    codeIndex.addPhoneticSeriesSynonym(series1);
    let series = await codeIndex.getPhoneticSeriesSynonyms('boo');
    expect(series).toEqual([series1]);

    codeIndex.addPhoneticSeriesSynonym(series2);
    series = await codeIndex.getPhoneticSeriesSynonyms('boo');
    expect(series).toEqual([series1, series2]);
    series = await codeIndex.getPhoneticSeriesSynonyms('hoo');
    expect(series).toEqual([series2]);

    codeIndex.addPhoneticSeriesSynonym(series3);
    series = await codeIndex.getPhoneticSeriesSynonyms('boo');
    expect(series).toEqual([series1, series2, series3]);
    series = await codeIndex.getPhoneticSeriesSynonyms('hoo');
    expect(series).toEqual([series2, series3]);
  });

  // depends on prior test having run
  test('removing phonetic series', async () => {
    codeIndex.removePhoneticSeriesSynonym(series3);
    let series = await codeIndex.getPhoneticSeriesSynonyms('boo');
    expect(series).toEqual([series1, series2]);
    series = await codeIndex.getPhoneticSeriesSynonyms('hoo');
    expect(series).toEqual([series2]);

    codeIndex.removePhoneticSeriesSynonym(series2);
    series = await codeIndex.getPhoneticSeriesSynonyms('boo');
    expect(series).toEqual([series1]);
    series = await codeIndex.getPhoneticSeriesSynonyms('hoo');
    expect(series).toBeNull();
  });
});
