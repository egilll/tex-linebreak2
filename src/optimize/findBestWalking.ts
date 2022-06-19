export function FindBestWalkingIncreasing<T>({
  initialGuess,
  min,
  max,
  func,
  scoreFunc,
  maxAttempts,
  initialStepSize,
  minStepSize,
}: {
  initialGuess: number;
  min?: number;
  max?: number;
  func: (arg0: number) => T;
  scoreFunc: (arg0: T) => number;
  maxAttempts?: number;
  initialStepSize: number;
  minStepSize: number;
}): number | null {
  let x = initialGuess;
  let xMin = min ?? 0;
  let xMax: number | null = max || null;
  let yBest: number | null = null;
  let xBest: number | null = null;
  let stepSize = initialStepSize;
  /** Input (x) to score (y) */
  const guesses: Map<number, number> = new Map();
  function bestGuess() {
    return [...guesses.entries()].reduce((a, b) => (b[1] < a[1] ? b : a))[0];
  }

  if (initialStepSize === 0) {
    throw new Error("initialStepSize cannot be 0");
  }

  outerLoop: for (let i = 0; i < (maxAttempts || 1000); i++) {
    const output = func(x);
    const y = scoreFunc(output);
    guesses.set(x, y);

    if (yBest == null || y < yBest) {
      yBest = y;
      xBest = x;
    }

    x += stepSize;
    if (xMax != null && x > xMax) {
      x = Math.max(bestGuess() - stepSize + minStepSize, xMin);
      stepSize = Math.round(stepSize / 2);
    }

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

  return xBest;
}
