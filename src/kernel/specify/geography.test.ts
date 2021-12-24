import { APP_NAME } from '../../app/app_name';
import { Platform } from '../../app-util/platform';
import { TestPrefs, TestPrefsFile, TestCredentials } from '../../test_config';
import { AppKernel } from '../app_kernel';
import { Geography } from './geography';

describe('the Geography class', () => {
  let testPrefs: TestPrefs;
  let kernel: AppKernel;
  let geography: Geography;

  // Use the test database for the application proper, rather
  // than the non-existent test DB for the current temporary app.
  const testCreds = new TestCredentials(APP_NAME);
  let username: string;
  let password: string;

  beforeAll(async () => {
    // TODO: Package this to make it easier to run database tests.
    const realPlatform = new Platform(APP_NAME, APP_NAME);
    testPrefs = await new TestPrefsFile(realPlatform).load();
    kernel = new AppKernel(realPlatform, testPrefs);
    await kernel.init();
    await testCreds.init();
    const creds = testCreds.get();
    if (creds === null) {
      throw Error('Test not configured');
    }
    await kernel.databaseCreds.set(creds.username, creds.password);
    await kernel.databaseCreds.validate();
    geography = kernel.specify.geography;
    await geography.load(kernel.database);
  });

  test('should read database with valid credentials', async () => {
    await kernel1.databaseCreds.clear();
    await kernel1.databaseCreds.set(username, password);
    await kernel1.databaseCreds.validate();
  });

  afterAll(async () => {
    // TODO: What about closing the database connection?
  });
});
