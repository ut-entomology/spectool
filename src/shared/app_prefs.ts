export class AppPrefs {
  dataFolder = '';

  constructor(copyFromPrefs?: AppPrefs) {
    if (copyFromPrefs) {
      this.copyFrom(copyFromPrefs);
    }
  }

  copyFrom(otherPrefs: AppPrefs) {
    this.dataFolder = otherPrefs.dataFolder;
  }

  isReady() {
    return this.dataFolder;
  }
}
