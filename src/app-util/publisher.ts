// Rudimentary analogue of a Svelte store for node.js apps. The callback
// is called immediately upon subscription.

type Callback<T> = (value: T) => void;

export class Publisher<T> {
  private _value: T;
  private _subscribers: Callback<T>[] = [];

  constructor(initialValue: T) {
    this._value = initialValue;
  }

  get() {
    return this._value;
  }

  set(value: T) {
    this._value = value;
    this._subscribers.forEach((callback) => callback(value));
  }

  subscribe(callback: Callback<T>) {
    this._subscribers.push(callback);
    callback(this._value);
  }
}
