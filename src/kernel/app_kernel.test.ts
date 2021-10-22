import { Knex } from 'knex'

import { Platform } from '../app-util/platform'
import { TestPrefsFile, TestCredentials } from '../test_config'
import { APP_NAME, AppKernel } from './app_kernel'
import { AppPrefs } from '../shared/app_prefs'
import { UserRecord } from '../shared/user_record'

const DUMMY_APP_NAME = "__ Temp Dummy App"

describe("app preferences", () => {
  const kernel1 = new AppKernel(DUMMY_APP_NAME)
  beforeAll(async () => {
    await kernel1.init()
  })

  test("should initially equal the defaults", () => {
    expect(kernel1.prefs).toEqual(new AppPrefs())
  })

  test("should change when saved", async () => {
    const prefs = kernel1.prefs
    prefs.databaseName = "dummy"
    await kernel1.savePrefs(prefs)
    const kernel2 = new AppKernel(DUMMY_APP_NAME)
    await kernel2.init()
    expect(kernel2.prefs).toEqual(prefs)
  })

  test("should return to defaults when dropped", async () => {
    const prefs = kernel1.prefs
    prefs.databaseName = "dummy"
    await kernel1.savePrefs(prefs)
    await kernel1.dropPrefs()
    const kernel2 = new AppKernel(DUMMY_APP_NAME)
    await kernel2.init()
    expect(kernel2.prefs).toEqual(new AppPrefs())
  })

  afterAll(async () => {
    await dropUserDir(kernel1)
  })
})

describe("the database", () => {
  const kernel1 = new AppKernel(DUMMY_APP_NAME)
  const testPlatform = new Platform(APP_NAME)
  const testPrefsFile = new TestPrefsFile(testPlatform)
  // Use the test database for the application proper, rather
  // than the non-existent test DB for the current temporary app.
  const testCreds = new TestCredentials(APP_NAME, testPrefsFile)
  let username: string
  let password: string

  beforeAll(async () => {
    await kernel1.init()
    await testCreds.init()
    const creds = testCreds.get()
    if (creds === null) {
      throw Error("Test not configured")
    }
    [username, password] = creds
  })

  test("should initially have no client", () => {
    expect.assertions(1)
    try {
      kernel1.database
    }
    catch (err) {
      if (err instanceof Error)
        expect(err.message).toContain("credentials")
    }
  })

  test("should read database with valid credentials", async () => {
    await kernel1.databaseCreds.clear()
    await kernel1.databaseCreds.set(username, password)
    const db = kernel1.database
    const firstNames = await queryFirstNames(db)
    expect(firstNames.length).toBeGreaterThan(0)
  })

  test("should fail to read database with invalid username", async () => {
    expect.assertions(1)
    await kernel1.databaseCreds.clear()
    await kernel1.databaseCreds.set("invalid-username", password)
    const db = kernel1.database
    try {
      await queryFirstNames(db)
    }
    catch (err) {
      if (err instanceof Error)
        expect(err.message.toLowerCase()).toContain("access denied")
    }
  })

  test("should fail to read database with invalid password", async () => {
    expect.assertions(1)
    await kernel1.databaseCreds.clear()
    await kernel1.databaseCreds.set(username, "invalid-password")
    const db = kernel1.database
    try {
      await queryFirstNames(db)
    }
    catch (err) {
      if (err instanceof Error)
        expect(err.message.toLowerCase()).toContain("access denied")
    }
  })

  afterAll(async () => {
    await kernel1.databaseCreds.clear()
    await dropUserDir(kernel1)
    await kernel1.database.destroy()
  })
})

async function queryFirstNames(db: Knex): Promise<string[]> {
  const lastNameToFind = "Smith"
  const rows = await db.select("firstname")
      .from<UserRecord>("agent")
      .where("lastname", lastNameToFind)
  const firstNames: string[] = []
  rows.forEach(row => firstNames.push(row.firstname))
  return firstNames
}

async function dropUserDir(kernel: AppKernel): Promise<void> {
  await kernel.platform.dropUserDir(kernel.platform.userConfigDir)
}
