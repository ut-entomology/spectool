import lodash from 'lodash';
import { promises as fsp } from 'fs';
import * as path from 'path';

import { fileNotFound } from './errors';
import { JsonFile } from './json_file';

const TESTING_DIR = path.join(__dirname, '../../testing');

interface Data {
  intValue: number;
  strValue: string;
}

class CustomJsonFile extends JsonFile<Data> {
  update(oldVersion: string, oldData: any): Data {
    oldData.strValue = 'updated ' + oldVersion;
    return oldData;
  }
}

beforeAll(async () => {
  try {
    await fsp.access(TESTING_DIR);
  } catch (err) {
    await fsp.mkdir(TESTING_DIR).catch((e) => e);
  }
});

describe('a default json file', () => {
  const jsonFile1 = new JsonFile<Data>(TESTING_DIR, 'test-data.json', '1', getDefaults);
  const jsonFile2 = new JsonFile<Data>(TESTING_DIR, 'test-data.json', '2', getDefaults);

  test('should require suffix .json', async () => {
    expect.assertions(1);
    try {
      new JsonFile(TESTING_DIR, 'test-data.txt', '1', getDefaults);
    } catch (err: any) {
      expect(err.message).toContain('missing suffix');
    }
  });

  test('should initially return the defaults', async () => {
    const data = await jsonFile1.load();
    expect(lodash.isEqual(data, getDefaults()));
  });

  test('should save changed data', async () => {
    const data1 = await jsonFile1.load();
    data1.intValue = 128;
    await jsonFile1.save(data1);
    const data2 = await jsonFile1.load();
    expect(lodash.isEqual(data2, data1));
  });

  test('should restore defaults on version changes', async () => {
    const data = await jsonFile2.load();
    expect(lodash.isEqual(data, getDefaults()));
    await jsonFile1.drop();
  });
});

describe('a custom data file', () => {
  const defaults: Data = {
    intValue: 32,
    strValue: 'foo'
  };
  const jsonFile1 = new CustomJsonFile(TESTING_DIR, 'test-data.json', '1', getDefaults);
  const jsonFile2 = new CustomJsonFile(TESTING_DIR, 'test-data.json', '2', getDefaults);

  test('should initially return the defaults', async () => {
    const data = await jsonFile1.load();
    expect(lodash.isEqual(data, defaults));
  });

  test('should update data for latest version', async () => {
    const data1 = await jsonFile1.load();
    data1.intValue = 128;
    await jsonFile1.save(data1);
    const data2 = await jsonFile2.load();
    expect(data2.intValue).toEqual(128);
    expect(data2.strValue).toEqual('updated 1');
  });
});

afterAll(async () => {
  try {
    const files = await fsp.readdir(TESTING_DIR);
    for (const fileName of files) {
      await fsp.unlink(path.join(TESTING_DIR, fileName));
    }
    await fsp.rmdir(TESTING_DIR);
  } catch (err) {
    if (!fileNotFound(err)) throw err;
  }
});

function getDefaults(): Data {
  return {
    intValue: 32,
    strValue: 'foo'
  };
}
