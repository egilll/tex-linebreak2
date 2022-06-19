export function BisectionFindMinimumPositiveIntegerOutput<T>({
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
}): T | null {
  let x = initialGuess;
  let xMin = min ?? 0;
  let xMax: number | null = max || null;
  let yBest: number | null = null;
  let xBest: number | null = null;
  let outputBest: T | null = null;
  /** X to Y (i.e. score) */
  const guesses: Map<number, number> = new Map();

  outerLoop: for (let i = 0; i < (maxAttempts || 1000); i++) {
    const output = func(x);
    const y = scoreFunc(output);
    guesses.set(x, y);

    if (y > 0 && (yBest == null || y < yBest)) {
      outputBest = output;
      yBest = y;
      xBest = x;
    }

    /** Found perfect score */
    if (y === 0) {
      break;
    }
    if (y > 0 && (xMax == null || x < xMax)) {
      xMax = x;
    }
    if (y < 0 && x > xMin) {
      xMin = x;
    }
    if (xMax == null) {
      x *= 2;
    } else {
      x = Math.round((xMin + xMax) / 2);
    }

    if (xMin === xMax) break;

    if (guesses.has(x)) {
      for (let i = 0; i < 10; i++) {
        if ((xMax == null || x + i < xMax) && !guesses.has(x + i)) {
          x += i;
          continue outerLoop;
        } else if (x - i >= xMin && !guesses.has(x - i)) {
          x -= i;
          continue outerLoop;
        }
      }
      break;
    }
  }
  return outputBest;
}
