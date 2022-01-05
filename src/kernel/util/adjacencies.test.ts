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

  function getNameToID() {
    const nameToID: Record<string, number> = {};
    Geography.addIDs(nameToID, geography.getCountries(), [
      SPECIFY_USA,
      'Canada',
      'Mexico'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID[SPECIFY_USA]), [
      'Texas',
      'Virginia'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Texas']), [
      'Travis County',
      'Burnet County',
      'Williamson County',
      'Bastrop County',
      'Caldwell County',
      'Hays County',
      'Blanco County',
      'Star County',
      'Zapata County',
      'Jim Hogg County',
      'Brooks County',
      'Hidalgo County'
    ]);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Canada']), ['Ontario']);
    Geography.addIDs(nameToID, geography.getStates(nameToID['Mexico']), ['Sonora']);
    return nameToID;
  }

  beforeAll(async () => {
    kernel = await createTestKernel();
    geography = kernel.specify.geography;
    await geography.load(kernel.database);
    adjacencies = new Adjacencies(geography);
    await adjacencies.load();
  });

  test('provides USA-internal county adjacencies', () => {
    const nameToID = getNameToID();

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
