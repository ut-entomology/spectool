/**
 * Utility class for identifying intervals of approximately once every given
 * number of milliseconds. Estimates how often to check the time and attempts
 * to check only at the specified sampling rate, because Date.now() is slow.
 */

export class IntervalTicker {
  targetMillisInterval: number;
  sampleRate: number;

  private _count = 0;
  private _countInterval = 1;
  private _lastCountTimeMillis = 0;
  private _lastYieldTimeMillis = 0;

  /**
   * @param targetMillisInterval The desired interval in milliseconds
   * @param sampleRate The approximate number of times to check the time
   *    during targetMillisInterval. Controls interval smoothness,with
   *    higher numbers providing more consistent times between intervals.
   * @param estimatedCountInterval The initial estimate of how many calls to
   *    `interval` can be made in targetMillisInterval milliseconds. Only
   *    affects the initial rates of reporting intervals.
   */
  constructor(
    targetMillisInterval: number,
    sampleRate: number,
    estimatedCountInterval: number
  ) {
    this.targetMillisInterval = targetMillisInterval;
    this.sampleRate = sampleRate;
    this._countInterval = Math.ceil(estimatedCountInterval / sampleRate);
  }

  /**
   * Starts tracking the time intervals. Cannot later be restarted.
   */
  start(): void {
    this._lastCountTimeMillis = Date.now();
    this._lastYieldTimeMillis = this._lastCountTimeMillis;
  }

  /**
   * Returns indicating whether the next targetMillisInterval  interval has
   * been reached, minimizing the number of calls made to Date.now().
   */
  interval(): boolean {
    if (++this._count == this._countInterval) {
      // Bomb if never initialized. This arrangement allows the ticker instance
      // to be constructed at any time, without incurring a per-tick clock cycle
      // hit checking to see that it was initialized.

      if (this._lastCountTimeMillis == 0) {
        throw Error('IntervalTicker was never started');
      }

      // Revise next count interval to be closer to target millisecond interval.

      const currentTimeMillis = Date.now();
      const deltaIntervalMillis = currentTimeMillis - this._lastCountTimeMillis;
      if (deltaIntervalMillis == 0) {
        ++this._countInterval; // count interval is not long enough
      } else {
        const correctedCountInterval =
          (this._countInterval * this.targetMillisInterval) /
          this.sampleRate /
          deltaIntervalMillis;
        // To smooth temporary blips, only gradually transition the count interval.
        // `Math.ceil` keeps it from ever becoming zero and preventing intervals.
        this._countInterval = Math.ceil(
          (this._countInterval + correctedCountInterval) / 2
        );

        // Prepare for next count interval.

        this._count = 0;
        this._lastCountTimeMillis = currentTimeMillis;

        // Report an interval about every targetMillisInterval milliseconds.

        if (
          currentTimeMillis - this._lastYieldTimeMillis >=
          this.targetMillisInterval
        ) {
          this._lastYieldTimeMillis = currentTimeMillis;
          return true;
        }
      }
    }
    return false;
  }
}
