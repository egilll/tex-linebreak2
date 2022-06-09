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

  for (let yOffset = lineHeight / 2; yOffset < height; yOffset += lineHeight) {
    const x = circleOfHeightOne(yOffset / height) * height;
    lineWidth.push(x);
    leftIndentPerLine.push((height - x) / 2);
  }
  return { lineWidth, leftIndentPerLine };
};

const getScore = (nodes: LineBreakingNode[], lineWidths: number[]) => {
  const actualLineNumber = nodes.length - 1;
  const idealLineNumber = lineWidths.length;
  const totalDemerits = nodes.at(-1)!.totalDemerits;
  const diff = idealLineNumber - actualLineNumber;
  if (diff < 0) return diff;
  return diff + Math.cbrt(totalDemerits) / nodes.length / 1000;
};

export const optimizeByFn = (obj: TexLinebreak): number[] => {
  obj.options.addInfiniteGlueToFinalLine = false;

  // const func = obj.options.optimizeByFn!;
  const guesses: Map<number, number> = new Map();

  let x = 500;
  let x_min = 4 * obj.options.lineHeight!;
  let x_max: number | null = null;

  let y_best: number | null = null;
  let x_best;
  let best;

  console.log({ lineHeight: obj.options.lineHeight });

  for (let i = 0; i < 50; i++) {
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

    const y = getScore(lineBreakingNodes, lineWidth);
    guesses.set(x, y);

    if (y > 0 && (y_best == null || y < y_best)) {
      y_best = y;
      x_best = x;
      best = {
        lineWidth,
        leftIndentPerLine,
        lineBreakingNodes,
      };
    }
    console.log({ x, y });
    if (y === 0) {
      break;
    }
    if (y > 0 && (x_max == null || x < x_max)) {
      x_max = x;
    }
    if (y < 0 && x > x_min) {
      x_min = x;
    }
    if (x_max == null) {
      x *= 2;
    } else {
      x = Math.round((x_min + x_max) / 2);
    }
    console.log({ nextGuess: x, x_low: x_min, x_high: x_max });

    if (x_min === x_max) break;

    if (guesses.has(x)) {
      for (let i = 0; i < 10; i++) {
        if (!guesses.has(x + i)) {
          x += i;
          break;
        } else if (!guesses.has(x - i)) {
          x -= i;
          break;
        }
      }
      break;
    }
  }
  if (best) {
    console.log({ x_best, y_best });
    // @ts-ignore
    obj.options.lineWidth = best.lineWidth;
    // @ts-ignore
    obj.options.leftIndentPerLine = best.leftIndentPerLine;
    // @ts-ignore
    return best.lineBreakingNodes.map((i) => i.index);
  } else {
    console.error("Failed to find a good width");
    return breakLines(obj.items, obj.options);
  }
};

export const BisectionFindMinimumPositiveIntegerOutput = ({
  initialGuess,
}: {
  initialGuess: number;
}) => {};
