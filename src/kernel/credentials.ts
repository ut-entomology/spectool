import * as keytar from 'keytar'

export abstract class Credentials {

  protected serviceName: string
  protected username?: string
  protected password?: string

  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  async init(): Promise<void> {
    const savedUsername = this.getSavedUsername()
    if (this.isSavingCredentials() && savedUsername) {
      const storedPassword = await keytar.getPassword(
          this.serviceName, savedUsername)
      if (storedPassword != null) {
        this.username = savedUsername
        this.password = storedPassword
      }
      else
        await this.saveUsername("")
    } else {
      const creds = await keytar.findCredentials(this.serviceName)
      for (const cred of creds)
        await keytar.deletePassword(this.serviceName, cred.account)
      this.username = undefined
    }
  }

  abstract getSavedUsername(): string

  getCredentials(): [string, string] | null {
    if (this.username && this.password)
      return [this.username, this.password]
    return null
  }

  abstract isSavingCredentials(): boolean

  abstract saveUsername(username: string): Promise<void>

  async setCredentials(username: string, password: string): Promise<void> {
    this.username = username
    this.password = password

    if (this.isSavingCredentials()) {
      await this.saveUsername(username)
      await keytar.setPassword(this.serviceName, username, password)
    } else {
      await this.saveUsername("")
      await keytar.deletePassword(this.serviceName, username) // ignore failure
    }
  }
}
