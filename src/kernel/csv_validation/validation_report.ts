import type * as queries from '../specify/queries';

export interface ReportState {
  status: string;
  work: (db: queries.DB) => Promise<void>;
}

export abstract class ValidationReport {
  protected _stateIndex = 0;

  start(db: queries.DB) {
    this._stateIndex = 0;
    return this.getStatus(db);
  }

  async getStatus(db: queries.DB): Promise<string | null> {
    const states = this._getStates();
    if (this._stateIndex > states.length) {
      return null;
    }
    if (this._stateIndex > 0) {
      await states[this._stateIndex - 1].work(db);
    }
    return states[this._stateIndex++].status;
  }

  abstract getReport(): any;

  abstract clear(): void;

  protected abstract _getStates(): ReportState[];
}
