import { SavableCredentials } from './savable_creds'

const DUMMY_APP_NAME = "__ Temp Dummy APP"

class TestCredentials extends SavableCredentials {

  saving: boolean
  savedUsername: string

  constructor(saving: boolean, initialUsername: string) {
    super(DUMMY_APP_NAME, "test")
    this.saving = saving
    this.savedUsername = initialUsername
  }

  getSavedUsername(): string {
    return this.savedUsername
  }

  isSavingCredentials(): boolean {
    return this.saving
  }

  async saveUsername(username: string): Promise<void> {
    this.savedUsername = username
  }
}

describe("savable credentials (not saving)", () => {
  const user1 = "user1"
  const pass1 = "pass1"
  const creds1 = new TestCredentials(false, "")
  beforeAll(async () => {
    await creds1.init()
  })

  test("should initially be empty", () => {
    expect(creds1.get()).toBe(null)
  })

  test("should return but not save assignment", async () => {
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    expect(creds1.savedUsername).toEqual("")
    const creds2 = new TestCredentials(false, "")
    await creds2.init()
    expect(creds2.get()).toBe(null)
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    const creds3 = new TestCredentials(true, user1)
    await creds3.init()
    expect(creds3.get()).toBe(null)
  })

  test("should clear a saved username", async () => {
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    const creds2 = new TestCredentials(false, user1)
    await creds2.init()
    expect(creds2.savedUsername).toEqual("")
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    const creds3 = new TestCredentials(true, user1)
    await creds3.init()
    expect(creds3.savedUsername).toEqual("")
  })

  afterAll(async () => {
    await creds1.clear()
  })
})

describe("savable credentials (saving)", () => {
  const user1 = "user1"
  const user2 = "user2"
  const pass1 = "pass1"
  const creds1 = new TestCredentials(true, "")
  beforeAll(async () => {
    await creds1.init()
  })

  test("should initially be empty", () => {
    expect(creds1.get()).toBe(null)
  })

  test("should save and return assignment", async () => {
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    expect(creds1.savedUsername).toEqual(user1)
    const creds2 = new TestCredentials(true, user1)
    await creds2.init()
    expect(creds2.get()).toEqual([user1, pass1])
    expect(creds2.savedUsername).toEqual(user1)
  })

  test("should clear an incorrect saved username", async () => {
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    const creds2 = new TestCredentials(true, user2)
    await creds2.init()
    expect(creds2.get()).toBe(null)
    expect(creds2.savedUsername).toEqual("")
  })

  test("should clear on configuration change", async () => {
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    const creds2 = new TestCredentials(false, user1)
    await creds2.init()
    expect(creds2.get()).toBe(null)
    expect(creds2.savedUsername).toEqual("")
  })

  test("should clear on explicitly clearing", async () => {
    await creds1.set(user1, pass1)
    expect(creds1.get()).toEqual([user1, pass1])
    await creds1.clear()
    const creds2 = new TestCredentials(true, user1)
    await creds2.init()
    expect(creds2.get()).toBe(null)
    expect(creds2.savedUsername).toEqual("")
  })

  afterAll(async () => {
    await creds1.clear()
  })
})

