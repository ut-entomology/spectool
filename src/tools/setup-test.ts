import readlineSync from 'readline-sync';

import { APP_NAME } from '../backend/app/app_name';
import { Platform } from '../app-util/platform';
import { TestPrefsFile, TestCredentials } from '../test_config';

/**
 * Sets up the app preferences and credentials for testing against
 * a development installation of Specify.
 */

async function setup(): Promise<void> {
  const platform = new Platform(APP_NAME, APP_NAME);
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

  const testCreds = new TestCredentials(APP_NAME);
  await testCreds.init();
  const initialCreds = testCreds.get();
  const defaultUsername = initialCreds ? initialCreds.username : 'tester';
  const username = readlineSync.question(`Username (${defaultUsername}): `, {
    defaultInput: defaultUsername
  });
  const password = readlineSync.question('Password: ', { hideEchoBack: true });

  await prefsFile.save(prefs);
  await testCreds.set(username, password);
  await testCreds.save();
}

setup()
  .then(() => {
    console.log('DONE\n');
  })
  .catch((err) => {
    console.log('FAILED:', err, '\n');
  });
