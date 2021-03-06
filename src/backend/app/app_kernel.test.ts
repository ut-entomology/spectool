import { APP_NAME } from './app_name';
import { Platform } from '../../util/platform';
import {
  TestPrefs,
  TestPrefsFile,
  TestCredentials
} from '../../backend/app/test_config';
import { AppKernel } from './app_kernel';

const MOCK_APP_NAME = '__ Temp Mock App';
const mockPlatform = new Platform(MOCK_APP_NAME, MOCK_APP_NAME);

describe('database configuration', () => {
  let testPrefs: TestPrefs;
  let kernel1: AppKernel;

  beforeAll(async () => {
    testPrefs = await new TestPrefsFile(mockPlatform).load();
    kernel1 = new AppKernel(mockPlatform, testPrefs);
    await kernel1.init();
  });

  test('should initially equal the defaults', () => {
    expect(kernel1.databaseConfig).toEqual(testPrefs);
  });

  test('should change when saved', async () => {
    const config = kernel1.databaseConfig;
    config.databaseName = 'mock';
    await kernel1.saveDatabaseConfig(config);
    const kernel2 = new AppKernel(mockPlatform, testPrefs);
    await kernel2.init();
    expect(kernel2.databaseConfig).toEqual(config);
  });

  test('should return to defaults when dropped', async () => {
    const config = kernel1.databaseConfig;
    config.databaseName = 'mock';
    await kernel1.saveDatabaseConfig(config);
    await kernel1.dropDatabaseConfig();
    const kernel2 = new AppKernel(mockPlatform, testPrefs);
    await kernel2.init();
    expect(kernel2.databaseConfig).toEqual(testPrefs);
  });

  afterAll(async () => {
    await dropUserDir();
  });
});

describe('the database', () => {
  let testPrefs: TestPrefs;
  let kernel1: AppKernel;

  // Use the test database for the application proper, rather
  // than the non-existent test DB for the current temporary app.
  const testCreds = new TestCredentials(APP_NAME);
  let username: string;
  let password: string;

  beforeAll(async () => {
    const realPlatform = new Platform(APP_NAME, APP_NAME);
    testPrefs = await new TestPrefsFile(realPlatform).load();
    kernel1 = new AppKernel(mockPlatform, testPrefs);
    await kernel1.init();
    await testCreds.init();
    const creds = testCreds.get();
    if (creds === null) {
      throw Error('Test not configured');
    }
    ({ username, password } = creds);
  });

  test('should initially have no client', () => {
    expect.assertions(1);
    try {
      kernel1.database;
    } catch (err) {
      if (err instanceof Error) expect(err.message).toContain('credentials');
    }
  });

  test('should read database with valid credentials', async () => {
    await kernel1.databaseCreds.clear();
    await kernel1.databaseCreds.set(username, password);
    await kernel1.databaseCreds.validate();
  });

  test('should invalidate connection on clearing credentials', async () => {
    expect.assertions(1);
    await kernel1.databaseCreds.clear();
    await kernel1.databaseCreds.set(username, password);
    await kernel1.databaseCreds.clear();
    try {
      await kernel1.databaseCreds.validate();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message.toLowerCase()).toContain('credentials');
      }
    }
  });

  test('should fail to read database with invalid username', async () => {
    expect.assertions(1);
    await kernel1.databaseCreds.clear();
    await kernel1.databaseCreds.set('invalid-username', password);
    try {
      await kernel1.databaseCreds.validate();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message.toLowerCase()).toContain('access denied');
      }
    }
  });

  test('should fail to read database with invalid password', async () => {
    expect.assertions(1);
    await kernel1.databaseCreds.clear();
    await kernel1.databaseCreds.set(username, 'invalid-password');
    try {
      await kernel1.databaseCreds.validate();
    } catch (err) {
      if (err instanceof Error) {
        expect(err.message.toLowerCase()).toContain('access denied');
      }
    }
  });

  afterAll(async () => {
    await kernel1.databaseCreds.clear();
    await dropUserDir();
  });
});

async function dropUserDir(): Promise<void> {
  await mockPlatform.dropUserDir(mockPlatform.userConfigDir);
}
