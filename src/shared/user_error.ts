/**
 * A generic class of error for which the user is somehow responsible.
 */

export class UserError extends Error {
  constructor(message: string) {
    super(message);
  }
}
