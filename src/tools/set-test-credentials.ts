import { Platform } from '../app-util/platform'
import { TestPrefs, TestPrefsFile, TestCredentials } from '../test_config'
import readlineSync from 'readline-sync'

const platform = new Platform()
const prefs = new TestPrefs()
const prefsFile = new TestPrefsFile(platform)

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

