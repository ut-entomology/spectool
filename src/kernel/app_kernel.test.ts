import { APP_NAME } from '../app/app_name';
import { TestCredentials } from '../test_config';
import { AppKernel } from './app_kernel';
import { DatabaseConfig } from '../shared/db_config';

const DUMMY_APP_NAME = '__ Temp Dummy App';

describe('database configuration', () => {
  const kernel1 = new AppKernel(DUMMY_APP_NAME);
  beforeAll(async () => {
    await kernel1.init();
  });

  test('should initially equal the defaults', () => {
    expect(kernel1.databaseConfig).toEqual(new DatabaseConfig());
  });

  test('should change when saved', async () => {
    const config = kernel1.databaseConfig;
    config.databaseName = 'dummy';
    await kernel1.saveDatabaseConfig(config);
    const kernel2 = new AppKernel(DUMMY_APP_NAME);
    await kernel2.init();
    expect(kernel2.databaseConfig).toEqual(config);
  });

  test('should return to defaults when dropped', async () => {
    const config = kernel1.databaseConfig;
    config.databaseName = 'dummy';
    await kernel1.saveDatabaseConfig(config);
    await kernel1.dropDatabaseConfig();
    const kernel2 = new AppKernel(DUMMY_APP_NAME);
    await kernel2.init();
    expect(kernel2.databaseConfig).toEqual(new DatabaseConfig());
  });

  afterAll(async () => {
    await dropUserDir(kernel1);
  });
});

describe('the database', () => {
  const kernel1 = new AppKernel(DUMMY_APP_NAME);
  // Use the test database for the application proper, rather
  // than the non-existent test DB for the current temporary app.
  const testCreds = new TestCredentials(APP_NAME);
  let username: string;
  let password: string;

  beforeAll(async () => {
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
    await dropUserDir(kernel1);
  });
});

async function dropUserDir(kernel: AppKernel): Promise<void> {
  await kernel.platform.dropUserDir(kernel.platform.userConfigDir);
}
