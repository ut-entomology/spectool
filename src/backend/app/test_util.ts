import { APP_NAME } from './app_name';
import { Platform } from '../../util/platform';
import { TestPrefsFile, TestCredentials } from './test_config';
import { AppKernel } from './app_kernel';

export async function createTestKernel(): Promise<AppKernel> {
  const testCreds = new TestCredentials(APP_NAME);
  const realPlatform = new Platform(APP_NAME, APP_NAME);
  const testPrefs = await new TestPrefsFile(realPlatform).load();
  const kernel = new AppKernel(realPlatform, testPrefs);
  await kernel.init();
  await testCreds.init();
  const creds = testCreds.get();
  if (creds === null) {
    throw Error('Test credentials not configured');
  }
  await kernel.databaseCreds.set(creds.username, creds.password);
  await kernel.databaseCreds.validate();
  return kernel;
}
