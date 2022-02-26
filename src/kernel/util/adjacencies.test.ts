import { createTestKernel } from '../../test_util';
import type { AppKernel } from '../app_kernel';
import { Adjacencies } from './adjacencies';
import { Geography } from '../specify/geography';
import { Region, SPECIFY_USA } from '../../shared/shared_geography';

describe('hardcoded region adjacencies', () => {
  let kernel: AppKernel;
  let geography: Geography;
  let adjacencies: Adjacencies;
  let nameToID: Record<string, number> = {};
  let hidalgoCountyNM_ID: number;
  let hidalgoCountyTX_ID: number;

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
      'Arizona',
      'Arkansas',
      'California',
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
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Arizona']), [
      // Counties adjacent to Mexico
      'Yuma County',
      'Pima County',
      'Santa Cruz County',
      'Cochise County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Arkansas']), [
      // Counties adjacent to Texas
      'Little River County',
      'Miller County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['California']), [
      // Counties adjacent to Mexico
      'San Diego County',
      'Imperial County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Louisiana']), [
      // Counties adjacent to Texas
      'Caddo Parish',
      'De Soto Parish',
      'Sabine Parish',
      'Vernon Parish',
      'Beauregard Parish',
      'Calcasieu Parish',
      'Cameron Parish'
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
      'Salem County',
      'Cumberland County',
      'Cape May County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['New Mexico']), [
      // Counties adjacen to Mexico
      'Hidalgo County',
      'Luna County',
      // Counties adjacent to Texas
      'Dona Ana County',
      'Otero County',
      'Eddy County',
      'Lea County',
      'Roosevelt County',
      'Curry County',
      'Quay County',
      'Union County'
    ]);
    hidalgoCountyNM_ID = nameToID['Hidalgo County'];
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Oklahoma']), [
      // Counties adjacent to Texas
      'Cimarron County',
      'Texas County',
      'Beaver County',
      'Ellis County',
      'Roger Mills County',
      'Beckham County',
      'Harmon County',
      'Jackson County',
      'Tillman County',
      'Cotton County',
      'Jefferson County',
      'Love County',
      'Marshall County',
      'Bryan County',
      'Choctaw County',
      'McCurtain County'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Pennsylvania']), [
      // Counties adjacent to Delware
      'Chester County',
      'Delaware County'
    ]);
    Geography.addIDs(
      nameToID,
      geography.getChildren(nameToID['Texas']),
      [
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
        'Red River County',
        // Additional counties adjacent to Mexico
        'El Paso County',
        'Hudspeth County',
        'Jeff Davis County',
        'Presidio County',
        'Brewster County',
        'Terrell County',
        'Val Verde County',
        'Kinney County',
        'Cameron County'
      ],
      true
    );
    hidalgoCountyTX_ID = nameToID['Hidalgo County'];
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Canada']), ['Ontario']);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Mexico']), ['Sonora']);
  }

  beforeAll(async () => {
    kernel = await createTestKernel();
    geography = kernel.specifyApi.geography;
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
      hidalgoCountyTX_ID,
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
      nameToID['New Jersey'],
      nameToID['Worcester County'],
      nameToID['Wicomico County'],
      nameToID['Dorchester County'],
      nameToID['Caroline County'],
      nameToID["Queen Anne's County"],
      nameToID['Kent County'],
      nameToID['Cecil County'],
      nameToID['Gloucester County'],
      nameToID['Salem County'],
      nameToID['Cumberland County'],
      nameToID['Cape May County'],
      nameToID['Chester County'],
      nameToID['Delaware County']
    ]);
  });

  test('provides USA border state adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Texas']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['Arkansas'],
      nameToID['Little River County'],
      nameToID['Miller County'],
      nameToID['Louisiana'],
      nameToID['Caddo Parish'],
      nameToID['De Soto Parish'],
      nameToID['Sabine Parish'],
      nameToID['Vernon Parish'],
      nameToID['Beauregard Parish'],
      nameToID['Calcasieu Parish'],
      nameToID['Cameron Parish'],
      nameToID['New Mexico'],
      nameToID['Dona Ana County'],
      nameToID['Otero County'],
      nameToID['Eddy County'],
      nameToID['Lea County'],
      nameToID['Roosevelt County'],
      nameToID['Curry County'],
      nameToID['Quay County'],
      nameToID['Union County'],
      nameToID['Oklahoma'],
      nameToID['Cimarron County'],
      nameToID['Texas County'],
      nameToID['Beaver County'],
      nameToID['Ellis County'],
      nameToID['Roger Mills County'],
      nameToID['Beckham County'],
      nameToID['Harmon County'],
      nameToID['Jackson County'],
      nameToID['Tillman County'],
      nameToID['Cotton County'],
      nameToID['Jefferson County'],
      nameToID['Love County'],
      nameToID['Marshall County'],
      nameToID['Bryan County'],
      nameToID['Choctaw County'],
      nameToID['McCurtain County'],
      nameToID['Mexico'],
      nameToID['Chihuahua'],
      nameToID['Coahuila'],
      nameToID['Nuevo Leon'],
      nameToID['Tamaulipas']
    ]);
  });

  test('provides Mexico border state adjacencies', () => {
    setNameToID();
    const foundAdjacencies = adjacencies.forID(nameToID['Nuevo Leon']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID[SPECIFY_USA],
      nameToID['Texas'],
      nameToID['Webb County'],
      nameToID['Coahuila'],
      nameToID['Tamaulipas'],
      nameToID['Zacatecas'],
      nameToID['San Luis Potosi'],
      nameToID[SPECIFY_USA]
    ]);
  });

  test('provides adjacent North American countries', () => {
    setNameToID();

    let foundAdjacencies = adjacencies.forID(nameToID['Mexico']);
    verifyRegionIDs(foundAdjacencies, [
      nameToID['United States'],
      nameToID['California'],
      nameToID['San Diego County'],
      nameToID['Imperial County'],
      nameToID['Arizona'],
      nameToID['Yuma County'],
      nameToID['Pima County'],
      nameToID['Santa Cruz County'],
      nameToID['Cochise County'],
      nameToID['New Mexico'],
      hidalgoCountyNM_ID,
      nameToID['Luna County'],
      nameToID['Dona Ana County'],
      nameToID['Texas'],
      nameToID['El Paso County'],
      nameToID['Hudspeth County'],
      nameToID['Jeff Davis County'],
      nameToID['Presidio County'],
      nameToID['Brewster County'],
      nameToID['Terrell County'],
      nameToID['Val Verde County'],
      nameToID['Kinney County'],
      nameToID['Maverick County'],
      nameToID['Webb County'],
      nameToID['Zapata County'],
      nameToID['Starr County'],
      hidalgoCountyTX_ID,
      nameToID['Cameron County'],
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
  for (const region of regions) {
    expect(expectedIDs).toContain(region.id);
  }
  const regionIDs = regions.map((region) => region.id);
  for (const expectedID of expectedIDs) {
    expect(regionIDs).toContain(expectedID);
  }
}
