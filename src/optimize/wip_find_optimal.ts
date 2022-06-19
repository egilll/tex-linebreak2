export function RandomWalkTemp<T>({
  initialGuess,
  min,
  max,
  func,
  scoreFunc,
  maxAttempts,
}: {
  initialGuess: number;
  /**
   * A positive integer.
   *
   * @default 0
   */
  min?: number;
  /** An integer 1 <= n */
  max?: number;
  /**
   * Must be a monotonic increasing function
   *
   * @param arg0
   */
  func: (arg0: number) => T;
  scoreFunc: (arg0: T) => number;
  maxAttempts?: number;
}): T | null {}
