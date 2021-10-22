import { APP_NAME } from '../kernel/app_kernel'
import { Platform } from '../app-util/platform'
import { TestPrefsFile, TestCredentials } from '../test_config'
import readlineSync from 'readline-sync'

async function setup(): Promise<void> {
  const platform = new Platform(APP_NAME)
  const prefsFile = new TestPrefsFile(platform)
  const prefs = await prefsFile.load()

  console.log("Please provide the MySQL database test configuration...\n")

  prefs.databaseHost = readlineSync.question("Host name: ",
      { defaultInput: prefs.databaseHost })
  prefs.databasePort = readlineSync.questionInt("Port: ",
      { defaultInput: prefs.databasePort.toString() })
  prefs.databaseName = readlineSync.question("Database name: ",
      { defaultInput: prefs.databaseName })
  prefs.databaseUsername= readlineSync.question("Username: ",
      { defaultInput: prefs.databaseUsername })
  const password = readlineSync.question("Password: ",
      { hideEchoBack: true })
  console.log(`Got password [${password}]`)

  const testCreds = new TestCredentials(APP_NAME, prefsFile)
  await testCreds.init()
  await testCreds.set(prefs.databaseUsername, password)
}

setup().then(() => {
  console.log("DONE")
}).catch(err => {
  console.log("FAILED:", err)
})
