import { createTestKernel } from '../../test_util';
import { AppKernel } from '../app_kernel';
import { Geography } from './geography';
import { RegionRank, Region } from '../../shared/region';
import { SPECIFY_USA } from '../../shared/specify_data';

describe('Specify geography', () => {
  let kernel: AppKernel;
  let geography: Geography;

  function getNameToID() {
    const nameToID: Record<string, number> = {};
    Geography.addIDs(nameToID, geography.getCountries(), [
      SPECIFY_USA,
      'Canada',
      'Mexico'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID[SPECIFY_USA]), [
      'Texas',
      'Maryland'
    ]);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Canada']), ['Ontario']);
    Geography.addIDs(nameToID, geography.getChildren(nameToID['Mexico']), ['Sonora']);
    return nameToID;
  }

  beforeAll(async () => {
    kernel = await createTestKernel();
    geography = kernel.specify.geography;
    await geography.load(kernel.database);
  });

  test('provides countries', () => {
    const nameToID = getNameToID();
    expect(nameToID[SPECIFY_USA]).toBeDefined();
    expect(nameToID['Canada']).toBeDefined();
    expect(nameToID['Mexico']).toBeDefined();
  });

  test('provides states', () => {
    function verifyStates(countryID: number, stateNames: string[]) {
      const stateIDs = Object.values(
        Geography.addIDs({}, geography.getChildren(countryID), stateNames)
      );
      expect(stateIDs.length).toEqual(stateNames.length);
      for (const stateID of stateIDs) {
        expect(stateID).toBeDefined();
        const region = geography.getRegionByRank(RegionRank.Country, stateID);
        expect(region?.id).toEqual(countryID);
      }
    }

    const nameToID = getNameToID();
    verifyStates(nameToID[SPECIFY_USA], ['Texas', 'Virginia', 'Maryland']);
    verifyStates(nameToID['Canada'], ['Yukon', 'British Columbia', 'Ontario']);
    verifyStates(nameToID['Mexico'], [
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

    const nameToID = getNameToID();
    verifyContainedIDs(nameToID[SPECIFY_USA]);
    verifyContainedIDs(nameToID['Canada']);
    verifyContainedIDs(nameToID['Mexico']);
    verifyContainedIDs(nameToID['Texas']);
    verifyContainedIDs(nameToID['Maryland']);
    verifyContainedIDs(nameToID['Ontario']);
    verifyContainedIDs(nameToID['Sonora']);
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

    const nameToID = getNameToID();
    verifyRegionsOfName(nameToID[SPECIFY_USA], 'Texas', 1);
    // Test Bastrop County because Specify has a space appended to it.
    verifyRegionsOfName(nameToID[SPECIFY_USA], 'Bastrop County', 1);
    verifyRegionsOfName(nameToID[SPECIFY_USA], 'Caldwell County', 4);
    verifyRegionsOfName(nameToID[SPECIFY_USA], 'Montgomery County', 18);
  });

  test('provides access to exact untrimmed Specify names', () => {
    const nameToID = getNameToID();
    const nameToRegionMap = geography.getNameToRegionMap(nameToID[SPECIFY_USA]);
    const regions = nameToRegionMap['Bastrop County'];
    expect(regions[0].exactName).toEqual('Bastrop County '); // with trailing space
  });

  test('provides the countries of specific geographic IDs', () => {
    function verifyCountries(regions: Region[], expectedCountryIDs: number[]) {
      let countries = geography.getCountriesOf(regions.map((region) => region.id));
      let countryIDs = countries.map((country) => country.id);
      expect(countryIDs.sort()).toEqual(expectedCountryIDs.sort());
    }

    const nameToID = getNameToID();

    let nameToRegionMap = geography.getNameToRegionMap(nameToID[SPECIFY_USA]);
    let regions = nameToRegionMap['Texas'];
    verifyCountries(regions, [nameToID[SPECIFY_USA]]);

    regions = regions.concat(nameToRegionMap['Virginia']);
    verifyCountries(regions, [nameToID[SPECIFY_USA]]);

    nameToRegionMap = geography.getNameToRegionMap(nameToID['Canada']);
    regions = regions.concat(nameToRegionMap['Ontario']);
    verifyCountries(regions, [nameToID[SPECIFY_USA], nameToID['Canada']]);

    nameToRegionMap = geography.getNameToRegionMap(nameToID['Mexico']);
    regions = regions.concat(nameToRegionMap['Sonora']);
    verifyCountries(regions, [
      nameToID[SPECIFY_USA],
      nameToID['Canada'],
      nameToID['Mexico']
    ]);
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

    const nameToID = getNameToID();

    let nameToRegionMap = geography.getNameToRegionMap(nameToID[SPECIFY_USA]);
    let regions = nameToRegionMap['Bastrop County'];
    verifyStates(nameToID[SPECIFY_USA], regions, [nameToID['Texas']]);

    regions = regions.concat(nameToRegionMap["Prince George's County"]);
    verifyStates(nameToID[SPECIFY_USA], regions, [
      nameToID['Texas'],
      nameToID['Maryland']
    ]);

    Geography.addIDs(nameToID, geography.getChildren(nameToID[SPECIFY_USA]), [
      'Kentucky',
      'North Carolina',
      'Missouri'
    ]);

    regions = regions.concat(nameToRegionMap['Caldwell County']);
    verifyStates(nameToID[SPECIFY_USA], regions, [
      nameToID['Texas'],
      nameToID['Maryland'],
      nameToID['Kentucky'],
      nameToID['North Carolina'],
      nameToID['Missouri']
    ]);
  });

  afterAll(async () => {
    kernel.destroy();
  });
});
