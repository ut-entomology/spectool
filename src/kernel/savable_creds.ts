import * as keytar from 'keytar'

/**
 * SavableCredentials is a class representing login credentials that can be
 * saved in a desktop application. It can save at most one username/password
 * pair. Whether it saves or clears saved credentials is configurable. The
 * caller is responsible for saving the username, so that this class can
 * ensure that a password is only ever returned for the expected username.
 * Regardless of whether the class is saving credentials, it keeps an
 * internal copy of the credentials for use by the application.
 */
export abstract class SavableCredentials {

  protected serviceName: string
  protected username?: string
  protected password?: string

  /**
   * Constructs an instance associating credentials with a service name.
   * @param serviceName Name of the service to which the credentials apply.
   *     Should be unique across all applications.
   */
  constructor(serviceName: string) {
    this.serviceName = serviceName
  }

  /**
   * Initializes prior to use, either loading previously-saved credentials
   * or clearing previously-saved credentials, as configured.
   */
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

  /**
   * Clears any previously-saved credentials associated with the service.
   */
  async clear(): Promise<void> {
    const creds = await keytar.findCredentials(this.serviceName)
    for (const cred of creds)
      await keytar.deletePassword(this.serviceName, cred.account)
    this.username = undefined
    this.password = undefined
  }

  /**
   * Returns the current credentials as a [username, password] tuple, if
   * assigned. Otherwise returns null.
   */
  get(): [string, string] | null {
    if (this.username && this.password)
      return [this.username, this.password]
    return null
  }

  /**
   * Returns the saved username when configured to save credentials.
   * Should return "" when there is no saved username.
   */
  abstract getSavedUsername(): string

  /**
   * Indicates whether the application is presently configured to save
   * the associated credentials. The return value may dynamically change
   * over the course of the application.
   */
  abstract isSavingCredentials(): boolean

  /**
   * Saves the indicated username for use retrieving its associated
   * password in the future.
   * @param username Username to save
   */
  abstract saveUsername(username: string): Promise<void>

  /**
   * Sets the credentials. If configured to save credentials, also
   * stores the credentials for future retrieval under this username.
   */
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
