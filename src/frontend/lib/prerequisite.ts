export interface Prerequisite {
  /**
   * Returns true when the prerequisite is already satisfied.
   */
  check: () => boolean;

  /**
   * Attempts to satisfy a prerequisite. May or may not succeed.
   */
  satisfy: (onSuccess: () => void) => void;
}
