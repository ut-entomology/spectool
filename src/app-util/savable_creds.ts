import * as keytar from 'keytar';

/**
 * SavableCredentials is a class representing login credentials that can be
 * saved in a desktop application. It can save at most one username/password
 * pair. The caller is responsible for seperately storing the username of a
 * persistently logged in user, so that this class can ensure that a password
 * is only ever returned for the expected username.
 */
export class SavableCredentials {
  serviceName: string;
  protected username?: string;
  protected password?: string;

  /**
   * Constructs an instance associating credentials with a service name.
   * @param appName Name of the application
   * @param appService Application-specific service name
   */
  constructor(appName: string, appService: string) {
    this.serviceName = appName + ' - ' + appService;
  }

  /**
   * Initializes prior to use. Loads previously-saved credentials, if
   * they are any. If more than one user is associated with the service,
   * clears all of the saved credentials.
   */
  async init(): Promise<void> {
    const creds = await keytar.findCredentials(this.serviceName);
    if (creds.length > 1) {
      await this.unsave();
    } else if (creds.length == 1) {
      this.username = creds[0].account;
      this.password = creds[0].password;
    }
  }

  /**
   * Clears all credentials associated with the service, both in-memory and saved.
   */
  async clear(): Promise<void> {
    this.username = undefined;
    this.password = undefined;
    await this.unsave();
  }

  /**
   * Returns the credentials of the currently logged in user or null
   * if no user is logged in.
   */
  get(): { username: string; password: string } | null {
    if (!this.username || !this.password) return null;
    return { username: this.username, password: this.password };
  }

  /**
   * Saves previously-assigned credentials to storage.
   */
  async save(): Promise<void> {
    if (!this.username || !this.password) {
      throw Error('Credentials were never set');
    }
    await keytar.setPassword(this.serviceName, this.username, this.password);
  }

  /**
   * Stores the provided credentials in-memory but does not save them.
   */
  async set(username: string, password: string): Promise<void> {
    this.username = username;
    this.password = password;
  }

  /**
   * Clears all saved credentials associated with this service,
   * but not in-memory credentials.
   */
  async unsave(): Promise<void> {
    const creds = await keytar.findCredentials(this.serviceName);
    for (const cred of creds)
      await keytar.deletePassword(this.serviceName, cred.account);
  }
}
