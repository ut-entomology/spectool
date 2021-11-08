export class AppPrefs {
  dataFolder = ''; // '' signals that prefs have not yet been set
  databaseHost = 'entomology.tacc.utexas.edu';
  databasePort = 3306;
  databaseName = 'specify_dev';

  constructor(copyFromPrefs?: AppPrefs) {
    if (copyFromPrefs) {
      this.copyFrom(copyFromPrefs);
    }
  }

  copyFrom(otherPrefs: AppPrefs) {
    this.dataFolder = otherPrefs.dataFolder;
    this.databaseHost = otherPrefs.databaseHost;
    this.databasePort = otherPrefs.databasePort;
    this.databaseName = otherPrefs.databaseName;
  }
}
