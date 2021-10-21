import * as keytar from 'keytar'

export abstract class SavableCredentials {

  protected serviceName: string
  protected username?: string
  protected password?: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  async init(): Promise<void> {
    const savedUsername = this.getSavedUsername()
    if (this.isSavingCredentials() && savedUsername) {
      const savedPassword = await keytar.getPassword(
          this.serviceName, savedUsername)
      if (savedPassword != null) {
        this.username = savedUsername
        this.password = savedPassword
      }
      else
        await this.saveUsername("")
    } else
      await this.clear() // to be safe; shouldn't be necessary
  }

  async clear(): Promise<void> {
    const creds = await keytar.findCredentials(this.serviceName)
    for (const cred of creds)
      await keytar.deletePassword(this.serviceName, cred.account)
    this.username = undefined
    this.password = undefined
  }

  get(): [string, string] | null {
    if (this.username && this.password)
      return [this.username, this.password]
    return null
  }

  abstract getSavedUsername(): string

  abstract isSavingCredentials(): boolean

  abstract saveUsername(username: string): Promise<void>

  async set(username: string, password: string): Promise<void> {
    if (this.isSavingCredentials()) {
      await this.saveUsername(username)
      await keytar.setPassword(this.serviceName, username, password)
    } else {
      await this.clear() // also clears local username and password
      await this.saveUsername("") // clear the saved username
    }
    this.username = username // assign after possibly having cleared
    this.password = password
  }
}
