/**
 * Indicates whether an error occurred because a file or directory
 * was not found.
 */
export function fileNotFound(error: any): boolean {
  return hasErrorCode(error) && error.code == 'ENOENT';
}

/**
 * Indicates whether an error has an error code, and if so,
 * typecast to ErrnoException.
 */
export function hasErrorCode(error: any): error is NodeJS.ErrnoException {
  return error.code !== undefined;
}

/**
 * An error in the application configuration.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
  }
}
