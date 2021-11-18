export class Connection {
  isConfigured; // whether the DB connection has been configured
  username: string | null; // username logged into DB, if logged in

  constructor(isConfigured: boolean = false, username: string | null = null) {
    this.isConfigured = isConfigured;
    this.username = username;
  }
}
