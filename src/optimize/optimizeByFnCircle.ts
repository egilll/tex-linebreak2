import { breakLines, LineBreakingNode } from "src/breakLines";
import { TexLinebreak } from "src/index";

const getLineWidths = (height: number, lineHeight: number) => {
  if (!lineHeight) {
    throw new Error(
      `lineHeight must be defined, got ${lineHeight}. You may need to use a DOMContentLoaded listener to wait until lineHeight can be read, or load your script at the end of the file.`
    );
  }

  /** Horizontal chord length of a circle given a ratio of height in circle */
  const circleOfHeightOne = (ratioOfTotalHeight: number) => {
    const radius = 1 / 2;
    const distanceFromCenter = Math.abs(ratioOfTotalHeight - radius);

    /** Finds chord length using perpendicular distance from center */
    return 2 * Math.sqrt(radius ** 2 - distanceFromCenter ** 2);
  };

  let lineWidth = [];
  let leftIndentPerLine = [];

  const leftover = height % lineHeight;
  const TRIM_AMOUNT_OFF_TOP_AND_BOTTOM = 0.05 * lineHeight;
  const heightAdjusted = height - leftover;

  for (
    let yOffset = leftover / 2 + TRIM_AMOUNT_OFF_TOP_AND_BOTTOM;
    yOffset < heightAdjusted;
    yOffset += lineHeight + (yOffset / height) * TRIM_AMOUNT_OFF_TOP_AND_BOTTOM
  ) {
    const x = circleOfHeightOne(yOffset / height) * height;
    lineWidth.push(x);
    leftIndentPerLine.push((height - x) / 2);
  }
  if (lineWidth[0] !== lineWidth.at(-1)) {
    console.warn(lineWidth);
  }
  return { lineWidth, leftIndentPerLine };
};

const getScore = ({
  lineBreakingNodes,
  lineWidth,
  leftIndentPerLine,
}: {
  lineBreakingNodes: LineBreakingNode[];
  lineWidth: number[];
  leftIndentPerLine: number[];
}) => {
  const actualLineNumber = lineBreakingNodes.length - 1;
  const idealLineNumber = lineWidth.length;
  const totalDemerits = lineBreakingNodes.at(-1)!.totalDemerits;
  const diff = idealLineNumber - actualLineNumber;
  if (diff < 0) return diff;
  return diff + Math.cbrt(totalDemerits) / lineBreakingNodes.length / 10000;
};

export function optimizeByFnCircle(obj: TexLinebreak): number[] {
  obj.options.addInfiniteGlueToFinalLine = false;

  const best = BisectionFindMinimumPositiveIntegerOutput({
    initialGuess: 500,
    min: 4 * obj.options.lineHeight!,
    maxAttempts: 30,
    scoreFunc: getScore,
    func: (x) => {
      let { lineWidth, leftIndentPerLine } = getLineWidths(
        x,
        obj.options.lineHeight!
      );
      const lineBreakingNodes: LineBreakingNode[] = breakLines(
        obj.items,
        {
          ...obj.options,
          lineWidth,
        },
        true
      );
      return {
        lineBreakingNodes,
        lineWidth,
        leftIndentPerLine,
      };
    },
  });

  if (best) {
    obj.options.lineWidth = best.lineWidth;
    obj.options.leftIndentPerLine = best.leftIndentPerLine;
    return best.lineBreakingNodes.map((i) => i.index);
  } else {
    console.error("Failed to find a good width");
    return breakLines(obj.items, obj.options);
  }
}

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
