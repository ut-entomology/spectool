import { promises as fsp } from 'fs'

import { Platform } from './platform'
import { hasErrorCode } from './util'

const dummyAppName = "__ Temp Dummy App"

describe("the platform", () => {
  const platform = new Platform(dummyAppName)

  test("should set a home directory", () => {
    expect(platform.userHomeDir).toBeTruthy()
  })

  test("should set a config directory", () => {
    expect(platform.userConfigDir).toBeTruthy()
    expect(platform.userConfigDir).toContain(dummyAppName)
  })

  test("should set a cache directory", () => {
    expect(platform.userCacheDir).toBeTruthy()
    expect(platform.userCacheDir).toContain(dummyAppName)
  })
})

describe("user files (using user cache dir)", () => {
  const platform = new Platform(dummyAppName)
  const userDir = platform.userCacheDir
  const cacheFile = "test.txt"
  const textOut = "cached data"
  let startTimeMillis = Date.now()

  test("user dir should not initially exist", async () => {
    expect.assertions(1)
    try {
      await fsp.stat(platform.userCacheDir)
    }
    catch (err) {
      if (hasErrorCode(err))
        expect(err.code).toEqual("ENOENT")
      else
        throw err
    }
  })

  test("file should not initially exist", async () => {
    const date = await platform.getUserFileDate(userDir, cacheFile)
    expect(date).toBeNull()
  })

  test("should initially be empty", async () => {
    const text = await platform.readTextUserFile(userDir, cacheFile)
    expect(text).toEqual("")
  })

  test("should be writable and readable", async () => {
    await platform.writeTextUserFile(userDir, cacheFile, textOut)
    const text = await platform.readTextUserFile(userDir, cacheFile)
    expect(text).toEqual(textOut)
  })

  test("should have an initial date", async () => {
    const date = await platform.getUserFileDate(userDir, cacheFile)
    expect(date?.getTime()).toBeGreaterThan(startTimeMillis)
  })

  test("should update date after rewriting", async () => {
    startTimeMillis = Date.now()
    await new Promise(resolve => setTimeout(resolve, 10))
    await platform.writeTextUserFile(userDir, cacheFile, textOut)
    const date = await platform.getUserFileDate(userDir, cacheFile)
    expect(date?.getTime()).toBeGreaterThan(startTimeMillis)
  })

  test("should erase files on dropping user dir", async () => {
    await platform.dropUserDir(userDir)
    const date = await platform.getUserFileDate(userDir, cacheFile)
    expect(date).toBeNull()
    const text = await platform.readTextUserFile(userDir, cacheFile)
    expect(text).toEqual("")
  })

  test("dropping user dir should have deleted user dir", async () => {
    expect.assertions(1)
    try {
      await fsp.stat(platform.userCacheDir)
    }
    catch (err) {
      if (hasErrorCode(err))
        expect(err.code).toEqual("ENOENT")
      else
        throw err
    }
  })

  test("should not error dropping non-existant user file", async () => {
    // First drop the user file from a non-existant directory.
    await platform.dropUserFile(userDir, cacheFile)
    // Now create the directory.
    await platform.writeTextUserFile(userDir, cacheFile, textOut)
    // Then erase a non-existant file in an existing directory.
    await platform.dropUserFile(userDir, "not-there")
  })

  test("should erase dropped user file", async () => {
    const text1 = await platform.readTextUserFile(userDir, cacheFile)
    expect(text1).toEqual(textOut)
    await platform.dropUserFile(userDir, cacheFile)
    const text2 = await platform.readTextUserFile(userDir, cacheFile)
    expect(text2).toEqual("")
    await platform.dropUserDir(userDir)
  })
})

afterAll(async () => {
  const platform = new Platform(dummyAppName)
  await platform.dropUserDir(platform.userCacheDir)
})
