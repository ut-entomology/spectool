/**
 * Utility class for yielding approximately once every given number of
 * milliseconds. Estimates how often to check the time and attempts to
 * check only once every that number of milliseconds, because calling
 * Date.now() is far slower than incrementing.
 */

export class TimeYielder {
  targetMillisInterval: number;
  sampleRate: number;

  private _count = 0;
  private _countInterval;
  private _lastCountTimeMillis = Date.now();
  private _lastYieldTimeMillis = this._lastCountTimeMillis;

  /**
   * Construct immediately prior to iterating calls to `trackTime`.
   *
   * @param targetMillisInterval The approximate interval in milliseconds at
   *    which to yield control. Controls the average rate of yielding.
   * @param sampleRate The approxiamte number of times to check the time
   *    during targetMillisInterval. Controls the smoothness of yielding,
   *    with higher numbers providing more consistent times between yields.
   * @param estimatedCountInterval The initial estimate of how many calls to
   *    `trackTime` can be made in targetMillisInterval milliseconds. Only
   *    affects the initial rates of yielding.
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
   * Returns a generator that yields approximately once every targetMillisInterval
   * milliseconds, minimizing the number of calls made to Date.now().
   */
  *start(): Generator<void, void, void> {
    // Yield once every _countInterval number of calls.

    if (++this._count == this._countInterval) {
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
        // `Math.ceil` keeps it from ever becoming zero and preventing all yielding.
        this._countInterval = Math.ceil(
          (this._countInterval + correctedCountInterval) / 2
        );

        // Prepare for next count interval.

        this._count = 0;
        this._lastCountTimeMillis = currentTimeMillis;

        // Yield about every targetMillisInterval milliseconds.

        if (
          currentTimeMillis - this._lastYieldTimeMillis >=
          this.targetMillisInterval
        ) {
          this._lastYieldTimeMillis = currentTimeMillis;
          yield;
        }
      }
    }
  }
}
