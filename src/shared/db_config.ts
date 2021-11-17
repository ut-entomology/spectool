export class DatabaseConfig {
  databaseHost = 'entomology.tacc.utexas.edu';
  databasePort = 3306;
  databaseName = '';

  constructor(copyFromPrefs?: DatabaseConfig) {
    if (copyFromPrefs) {
      this.copyFrom(copyFromPrefs);
    }
  }

  copyFrom(otherPrefs: DatabaseConfig) {
    this.databaseHost = otherPrefs.databaseHost;
    this.databasePort = otherPrefs.databasePort;
    this.databaseName = otherPrefs.databaseName;
  }

  isReady() {
    return !!this.databaseHost && this.databasePort != 0 && !!this.databaseName;
  }
}
