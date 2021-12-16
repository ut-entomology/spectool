export interface DatabaseValues {
  databaseHost: string;
  databasePort: number;
  databaseName: string;
}

export class DatabaseConfig implements DatabaseValues {
  // Provides the application default values
  databaseHost = 'entomology.tacc.utexas.edu';
  databasePort = 3306;
  databaseName = '';

  constructor(initialValues?: DatabaseValues) {
    if (initialValues) {
      this.copyFrom(initialValues);
    }
  }

  copyFrom(values: DatabaseValues) {
    this.databaseHost = values.databaseHost;
    this.databasePort = values.databasePort;
    this.databaseName = values.databaseName;
  }

  isReady() {
    return !!this.databaseHost && this.databasePort != 0 && !!this.databaseName;
  }
}
