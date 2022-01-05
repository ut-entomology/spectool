import { createTestKernel } from '../../test_util';
import { AppKernel } from '../app_kernel';
import { Adjacencies } from './adjacencies';
import { Geography } from '../specify/geography';
import { Region } from '../../shared/region';
import { SPECIFY_USA } from '../../shared/specify_data';

describe('Specify geography', () => {
  let kernel: AppKernel;
  let geography: Geography;
  let adjacencies: Adjacencies;
  let nameToID: Record<string, number> = {};

  function setNameToID() {
    if (Object.keys(nameToID).length > 0) {
      return;
    }
    Geography.addIDs(nameToID, geography.getCountries(), [
      SPECIFY_USA,
      'Canada',
      'Mexico'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID[SPECIFY_USA]), [
      'Arkansas',
      'Oklahoma',
      'Texas',
      'Virginia'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Arkansas']), [
      // Counties adjacent to Bowie County, Texas
      'Little River County',
      'Miller County'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Oklahoma']), [
      // Counties adjacent to Bowie County, Texas
      'McCurtain County'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Texas']), [
      // Counties surrounding Travis County
      'Travis County',
      'Burnet County',
      'Williamson County',
      'Bastrop County',
      'Caldwell County',
      'Hays County',
      'Blanco County',
      // Counties surrounding Starr County
      'Starr County',
      'Zapata County',
      'Jim Hogg County',
      'Brooks County',
      'Hidalgo County',
      // Counties surrounding Hockley County
      'Hockley County',
      'Cochran County',
      'Bailey County',
      'Lamb County',
      'Hale County',
      'Lubbock County',
      'Lynn County',
      'Terry County',
      'Yoakum County',
      // Counties surrounding Bowie County in Texas
      'Bowie County',
      'Cass County',
      'Morris County',
      'Red River County'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Canada']), ['Ontario']);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Mexico']), ['Sonora']);
  }

  beforeAll(async () => {
    kernel = await createTestKernel();
    geography = kernel.specify.geography;
    await geography.load(kernel.database);
    adjacencies = new Adjacencies(geography);
    await adjacencies.load();
  });

  test('provides state-internal county adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Travis County']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Burnet County'],
      nameToID['Williamson County'],
      nameToID['Bastrop County'],
      nameToID['Caldwell County'],
      nameToID['Hays County'],
      nameToID['Blanco County']
    ]);
  });

  test('provides state-internal corner county adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Hockley County']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Cochran County'],
      nameToID['Bailey County'],
      nameToID['Lamb County'],
      nameToID['Hale County'],
      nameToID['Lubbock County'],
      nameToID['Lynn County'],
      nameToID['Terry County'],
      nameToID['Yoakum County']
    ]);
  });

  test('provides interstate border county adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Bowie County']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Cass County'],
      nameToID['Morris County'],
      nameToID['Red River County'],
      nameToID['Little River County'],
      nameToID['Miller County'],
      nameToID['McCurtain County']
    ]);
  });

  test('provides USA county adjacencies at USA-Mexico border', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Starr County']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Zapata County'],
      nameToID['Jim Hogg County'],
      nameToID['Brooks County'],
      nameToID['Hidalgo County']
    ]);
  });

  afterAll(async () => {
    kernel.destroy();
  });
});

function verifyRegionIDs(regions: Region[], expectedIDs: number[]) {
  expect(regions.length).toEqual(expectedIDs.length);
  for (const region of regions) {
    expect(expectedIDs).toContain(region.id);
  }
}
