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
      'Belize',
      'Canada',
      'El Salvador',
      'Guatemala',
      'Honduras',
      'Mexico'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID[SPECIFY_USA]), [
      'Arkansas',
      'Delaware',
      'Louisiana',
      'Maryland',
      'New Mexico',
      'New Jersey',
      'Oklahoma',
      'Pennsylvania',
      'Texas',
      'Virginia'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Mexico']), [
      'Chihuahua',
      'Coahuila',
      'Nuevo Leon',
      'Tamaulipas',
      'Zacatecas',
      'San Luis Potosi'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Arkansas']), [
      // Counties adjacent to Bowie County, Texas
      'Little River County',
      'Miller County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Maryland']), [
      // Counties adjacent to Delaware
      'Worcester County',
      'Wicomico County',
      'Dorchester County',
      'Caroline County',
      "Queen Anne's County",
      'Kent County',
      'Cecil County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['New Jersey']), [
      // Counties adjacent to Delware
      'Gloucester County',
      'Salem County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Oklahoma']), [
      // Counties adjacent to Bowie County, Texas
      'McCurtain County'
    ]);
    console.log('**** PA ID', nameToID['Pennsylvania']);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Pennsylvania']), [
      // Counties adjacent to Delware
      'Chester County',
      'Delaware County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Texas']), [
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
      // Additional counties around Webb County
      'Webb County',
      'Maverick County',
      'Dimmit County',
      'La Salle County',
      'McMullen County',
      'Duval County',
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
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Canada']), ['Ontario']);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Mexico']), ['Sonora']);
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
      nameToID['McCurtain County'],
      nameToID['Oklahoma'],
      nameToID['Arkansas']
    ]);
  });

  test('provides USA county adjacencies at USA-Mexico border', () => {
    setNameToID();
    let foundAdjacencies = adjacencies.forID(nameToID['Webb County']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Maverick County'],
      nameToID['Dimmit County'],
      nameToID['La Salle County'],
      nameToID['McMullen County'],
      nameToID['Duval County'],
      nameToID['Zapata County'],
      nameToID['Jim Hogg County'],
      nameToID['Coahuila'],
      nameToID['Nuevo Leon'],
      nameToID['Tamaulipas'],
      nameToID['Mexico']
    ]);

    foundAdjacencies = adjacencies.forID(nameToID['Starr County']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Zapata County'],
      nameToID['Jim Hogg County'],
      nameToID['Brooks County'],
      nameToID['Hidalgo County'],
      nameToID['Tamaulipas'],
      nameToID['Mexico']
    ]);
  });

  test('provides USA-internal state adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Delaware']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Maryland'],
      nameToID['Pennsylvania'],
      nameToID['New Jersey']
      // nameToID['Worcester County'],
      // nameToID['Wicomica County'],
      // nameToID['Dorchester County'],
      // nameToID['Caroline County'],
      // nameToID["Queen Anne's County"],
      // nameToID['Kent County'],
      // nameToID['Cecil County'],
      // nameToID['Gloucester County'],
      // nameToID['Salem County'],
      // nameToID['Chester County'],
      // nameToID['Delaware County']
    ]);
  });

  test('provides USA border state adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Texas']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Arkansas'],
      nameToID['Louisiana'],
      nameToID['New Mexico'],
      nameToID['Oklahoma'],
      nameToID['Chihuahua'],
      nameToID['Coahuila'],
      nameToID['Nuevo Leon'],
      nameToID['Tamaulipas'],
      nameToID['Mexico']
    ]);
  });

  test('provides Mexico border state adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Nuevo Leon']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Texas'],
      nameToID['Coahuila'],
      nameToID['Tamaulipas'],
      nameToID['Zacatecas'],
      nameToID['San Luis Potosi'],
      nameToID[SPECIFY_USA]
    ]);
  });

  test('provides adjacent North American countries', () => {
    setNameToID();
    let foundAdjacencies = adjacencies.forID(nameToID['United States']);
    verifyRegionIDs(foundAdjacencies, [nameToID['Mexico'], nameToID['Canada']]);

    foundAdjacencies = adjacencies.forID(nameToID['Mexico']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['United States'],
      nameToID['Guatemala'],
      nameToID['Belize']
    ]);

    foundAdjacencies = adjacencies.forID(nameToID['Guatemala']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Mexico'],
      nameToID['Belize'],
      nameToID['El Salvador'],
      nameToID['Honduras']
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
