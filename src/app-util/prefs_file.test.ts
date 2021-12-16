import lodash from 'lodash';

import { Platform } from './platform';
import { PreferencesFile } from './prefs_file';

const DUMMY_APP_NAME = '__ Temp Dummy App';

interface Prefs {
  intValue: number;
  strValue: string;
}

class PlainPrefsFile extends PreferencesFile<Prefs> {
  typecast(prefs: any) {
    return prefs as Prefs;
  }
}

class CustomPrefsFile extends PreferencesFile<Prefs> {
  update(oldVersion: string, oldPrefs: any): Prefs {
    oldPrefs.strValue = 'updated ' + oldVersion;
    return oldPrefs;
  }

  typecast(prefs: any) {
    return prefs as Prefs;
  }
}

describe('a default preferences file', () => {
  const platform = new Platform(DUMMY_APP_NAME, DUMMY_APP_NAME);
  const prefsFile1 = new PlainPrefsFile(platform, 'prefs', '1', getDefaults);
  const prefsFile2 = new PlainPrefsFile(platform, 'prefs', '2', getDefaults);

  test('should not allow a file type suffix', async () => {
    expect.assertions(1);
    try {
      new PlainPrefsFile(platform, 'prefs.txt', '1', getDefaults);
    } catch (err: any) {
      expect(err.message).toContain('file type suffix');
    }
  });

  test('should initially return the defaults', async () => {
    const prefs = await prefsFile1.load();
    expect(lodash.isEqual(prefs, getDefaults()));
  });

  test('should save changed preferences', async () => {
    const prefs1 = await prefsFile1.load();
    prefs1.intValue = 128;
    await prefsFile1.save(prefs1);
    const prefs2 = await prefsFile1.load();
    expect(lodash.isEqual(prefs2, prefs1));
  });

  test('should restore defaults on version changes', async () => {
    const prefs = await prefsFile2.load();
    expect(lodash.isEqual(prefs, getDefaults()));
    await prefsFile1.drop();
  });
});

describe('a custom preferences file', () => {
  const platform = new Platform(DUMMY_APP_NAME, DUMMY_APP_NAME);
  const defaults: Prefs = {
    intValue: 32,
    strValue: 'foo'
  };
  const prefsFile1 = new CustomPrefsFile(platform, 'prefs', '1', getDefaults);
  const prefsFile2 = new CustomPrefsFile(platform, 'prefs', '2', getDefaults);

  test('should initially return the defaults', async () => {
    const prefs = await prefsFile1.load();
    expect(lodash.isEqual(prefs, defaults));
  });

  test('should update preferences for latest version', async () => {
    const prefs1 = await prefsFile1.load();
    prefs1.intValue = 128;
    await prefsFile1.save(prefs1);
    const prefs2 = await prefsFile2.load();
    expect(prefs2.intValue).toEqual(128);
    expect(prefs2.strValue).toEqual('updated 1');
  });
});

afterAll(async () => {
  const platform = new Platform(DUMMY_APP_NAME, DUMMY_APP_NAME);
  await platform.dropUserDir(platform.userConfigDir);
});

function getDefaults(): Prefs {
  return {
    intValue: 32,
    strValue: 'foo'
  };
}
