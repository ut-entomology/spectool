import { createTestKernel } from '../../test_util';
import { AppKernel } from '../app_kernel';
import { Geography } from './geography';
import { RegionRank, Region } from '../../shared/region';
import { SPECIFY_USA } from '../../shared/specify_data';

describe('Specify geography', () => {
  let kernel: AppKernel;
  let geography: Geography;
  let usaID: number;
  let canadaID: number;
  let mexicoID: number;
  let texasID: number;
  let marylandID: number;
  let ontarioID: number;
  let sonoraID: number;

  function setCountryIDs() {
    if (!usaID) {
      [usaID, canadaID, mexicoID] = Geography.findIDs(geography.getCountries(), [
        SPECIFY_USA,
        'Canada',
        'Mexico'
      ]);
    }
  }

  function setStateIDs() {
    if (!texasID) {
      [texasID, marylandID] = Geography.findIDs(geography.getStates(usaID), [
        'Texas',
        'Maryland'
      ]);
      [ontarioID] = Geography.findIDs(geography.getStates(canadaID), ['Ontario']);
      [sonoraID] = Geography.findIDs(geography.getStates(mexicoID), ['Sonora']);
    }
  }

  beforeAll(async () => {
    kernel = await createTestKernel();
    geography = kernel.specify.geography;
    await geography.load(kernel.database);
  });

  test('provides countries', () => {
    setCountryIDs();
    expect(usaID).toBeDefined();
    expect(canadaID).toBeDefined();
    expect(mexicoID).toBeDefined();
  });

  test('provides states', () => {
    function verifyStates(countryID: number, stateNames: string[]) {
      const stateIDs = Geography.findIDs(geography.getStates(countryID), stateNames);
      expect(stateIDs.length).toEqual(stateNames.length);
      for (const stateID of stateIDs) {
        expect(stateID).toBeDefined();
        const region = geography.getRegionByRank(RegionRank.Country, stateID);
        expect(region?.id).toEqual(countryID);
      }
    }

    setCountryIDs();
    verifyStates(usaID, ['Texas', 'Virginia', 'Maryland']);
    verifyStates(canadaID, ['Yukon', 'British Columbia', 'Ontario']);
    verifyStates(mexicoID, [
      'Nuevo Leon', // latiniziation of 'Nuevo León'
      'Oaxaca',
      'Queretaro', // latinization of 'Querétaro'
      'Sonora',
      'Yucatan' // latinization of 'Yucatán'
    ]);
  });

  test('provides contained geography IDs', () => {
    function verifyContainedIDs(containingID: number) {
      const containingRank = geography.getRegionByID(containingID)!.rank;
      const containedIDs = geography.getContainedGeographyIDs(containingID);
      const foundIDs: Record<number, boolean> = {};
      for (const containedID of containedIDs) {
        expect(foundIDs[containedID]).toBeFalsy(); // each ID only once
        expect(containedID).not.toEqual(containingID);
        const containerOfRank = geography.getRegionByRank(containingRank, containedID);
        expect(containerOfRank?.id).toEqual(containingID);
        foundIDs[containedID] = true;
      }
    }

    setCountryIDs();
    setStateIDs();
    verifyContainedIDs(usaID);
    verifyContainedIDs(canadaID);
    verifyContainedIDs(mexicoID);
    verifyContainedIDs(texasID);
    verifyContainedIDs(marylandID);
    verifyContainedIDs(ontarioID);
    verifyContainedIDs(sonoraID);
  });

  test('provides geography name map with trimmed names', () => {
    function verifyRegionsOfName(
      underID: number,
      lookupName: string,
      expectedCount: number
    ) {
      const containedIDs = geography.getContainedGeographyIDs(underID);
      const foundRegionsOfName: Region[] = [];
      for (const containedID of containedIDs) {
        const region = geography.getRegionByID(containedID);
        if (region!.name == lookupName) {
          foundRegionsOfName.push(region!);
        }
      }
      const expectedIDs = foundRegionsOfName.map((region) => region.id);
      expect(expectedIDs.length).toEqual(expectedCount);

      const nameToRegionMap = geography.getNameToRegionMap(underID);
      const regionIDs = nameToRegionMap[lookupName].map((region) => region.id);
      expect(regionIDs.sort()).toEqual(expectedIDs.sort());
    }

    setCountryIDs();
    setStateIDs();
    verifyRegionsOfName(usaID, 'Texas', 1);
    // Test Bastrop County because Specify has a space appended to it.
    verifyRegionsOfName(usaID, 'Bastrop County', 1);
    verifyRegionsOfName(usaID, 'Caldwell County', 4);
    verifyRegionsOfName(usaID, 'Montgomery County', 18);
  });

  test('provides access to exact untrimmed Specify names', () => {
    setCountryIDs();
    const nameToRegionMap = geography.getNameToRegionMap(usaID);
    const regions = nameToRegionMap['Bastrop County'];
    expect(regions[0].exactName).toEqual('Bastrop County '); // with trailing space
  });

  test('provides the countries of specific geographic IDs', () => {
    function verifyCountries(regions: Region[], expectedCountryIDs: number[]) {
      let countries = geography.getCountriesOf(regions.map((region) => region.id));
      let countryIDs = countries.map((country) => country.id);
      expect(countryIDs.sort()).toEqual(expectedCountryIDs.sort());
    }

    setCountryIDs();
    setStateIDs();

    let nameToRegionMap = geography.getNameToRegionMap(usaID);
    let regions = nameToRegionMap['Texas'];
    verifyCountries(regions, [usaID]);

    regions = regions.concat(nameToRegionMap['Virginia']);
    verifyCountries(regions, [usaID]);

    nameToRegionMap = geography.getNameToRegionMap(canadaID);
    regions = regions.concat(nameToRegionMap['Ontario']);
    verifyCountries(regions, [usaID, canadaID]);

    nameToRegionMap = geography.getNameToRegionMap(mexicoID);
    regions = regions.concat(nameToRegionMap['Sonora']);
    verifyCountries(regions, [usaID, canadaID, mexicoID]);
  });

  test('provides the states of specific geographic IDs', () => {
    function verifyStates(
      countryID: number,
      regions: Region[],
      expectedStateIDs: number[]
    ) {
      let states = geography.getStatesOf(
        countryID,
        regions.map((region) => region.id)
      );
      let stateIDs = states.map((state) => state.id);
      expect(stateIDs.sort()).toEqual(expectedStateIDs.sort());
    }

    setCountryIDs();
    setStateIDs();

    let nameToRegionMap = geography.getNameToRegionMap(usaID);
    let regions = nameToRegionMap['Bastrop County'];
    verifyStates(usaID, regions, [texasID]);

    regions = regions.concat(nameToRegionMap["Prince George's County"]);
    verifyStates(usaID, regions, [texasID, marylandID]);

    const [kentuckyID, northCarolinaID, missouriID] = Geography.findIDs(
      geography.getStates(usaID),
      ['Kentucky', 'North Carolina', 'Missouri']
    );

    regions = regions.concat(nameToRegionMap['Caldwell County']);
    verifyStates(usaID, regions, [
      texasID,
      marylandID,
      kentuckyID,
      northCarolinaID,
      missouriID
    ]);
  });

  afterAll(async () => {
    kernel.destroy();
  });
});
