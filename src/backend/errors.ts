
/**
 * An error in the application configuration.
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(message)
  }
}
