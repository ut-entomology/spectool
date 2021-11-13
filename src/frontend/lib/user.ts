import { DatabaseClient } from '../clients/database_client';

export class User {
  username: string;
  saved: boolean;

  constructor(username: string, saved: boolean) {
    this.username = username;
    this.saved = saved;
  }

  static getLoggedInUser() {
    const initialUsername = DatabaseClient.getUsername();
    const saved = DatabaseClient.isSaved();
    return initialUsername ? new User(initialUsername, saved) : null;
  }

  static async login(username: string, password: string, save: boolean) {
    if (save) {
      await DatabaseClient.loginAndSave({ username, password });
    } else {
      await DatabaseClient.login({ username, password });
    }
    return new User(username, save);
  }

  static async logout() {
    await DatabaseClient.logout();
  }
}
