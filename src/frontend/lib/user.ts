import { DatabaseClient } from '../clients/database_client';

export class User {
  username: string;
  saved: boolean;

  constructor(username: string, saved: boolean) {
    this.username = username;
    this.saved = saved;
  }

  static getLoggedInUser() {
    const initialUsername = DatabaseClient.getUsername(window);
    const saved = DatabaseClient.isSaved(window);
    return initialUsername ? new User(initialUsername, saved) : null;
  }

  static async login(username: string, password: string, save: boolean) {
    if (save) {
      await DatabaseClient.loginAndSave(window, { username, password });
    } else {
      await DatabaseClient.login(window, { username, password });
    }
    return new User(username, save);
  }

  static async logout() {
    await DatabaseClient.logout(window);
  }
}
