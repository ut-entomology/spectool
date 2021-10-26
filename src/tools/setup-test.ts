import readlineSync from 'readline-sync';

import { APP_NAME } from '../kernel/app_kernel';
import { Platform } from '../app-util/platform';
import { TestPrefsFile, TestCredentials } from '../test_config';

/**
 * Sets up the app preferences and credentials for testing against
 * a development installation of Specify.
 */

async function setup(): Promise<void> {
  const platform = new Platform(APP_NAME);
  const prefsFile = new TestPrefsFile(platform);
  const prefs = await prefsFile.load();

  console.log('\nPlease provide the MySQL database test configuration...');
  console.log('(Hit enter to keep the current value.)\n');

  prefs.databaseHost = readlineSync.question(`Host name (${prefs.databaseHost}): `, {
    defaultInput: prefs.databaseHost
  });
  prefs.databasePort = readlineSync.questionInt(`Port (${prefs.databasePort}): `, {
    defaultInput: prefs.databasePort.toString()
  });
  prefs.databaseName = readlineSync.question(
    `Database name (${prefs.databaseName}): `,
    { defaultInput: prefs.databaseName }
  );
  prefs.databaseUsername = readlineSync.question(
    `Username (${prefs.databaseUsername}): `,
    {
      defaultInput: prefs.databaseUsername
    }
  );
  const password = readlineSync.question('Password: ', { hideEchoBack: true });

  const testCreds = new TestCredentials(APP_NAME);
  await prefsFile.save(prefs);
  await testCreds.init(prefs.databaseUsername);
  await testCreds.set(prefs.databaseUsername, password);
  await testCreds.save();
}

setup()
  .then(() => {
    console.log('DONE\n');
  })
  .catch((err) => {
    console.log('FAILED:', err, '\n');
  });
