
/**
 * Indicate whether an error has an error code, and if so,
 * typecast to ErrnoException.
 */
export function hasErrorCode(error: any): error is NodeJS.ErrnoException {
  return error.code !== undefined
}
