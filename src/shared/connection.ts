export class Connection {
  configured; // whether the DB connection has been configured
  username: string | null; // username logged into DB, if logged in

  constructor(configured: boolean = false, username: string | null = null) {
    this.configured = configured;
    this.username = username;
  }
}
