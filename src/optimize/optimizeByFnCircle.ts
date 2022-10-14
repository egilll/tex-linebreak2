import { breakLines, LineBreakingNode } from "src/breakLines";
import { TexLinebreak } from "src/index";
import { BisectionFindMinimumPositiveIntegerOutput } from "src/optimize/bisection";

const circleLineWidths = (height: number, lineHeight: number) => {
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

  /** Start in the middle */
  for (let yOffset = 0.5 * height; yOffset < height; yOffset += lineHeight) {
    const x = circleOfHeightOne(yOffset / height) * height;
    if (lineWidth.length > 0) {
      lineWidth.unshift(x);
    }
    lineWidth.push(x);
  }

  const leftIndentPerLine = lineWidth.map((x) => (height - x) / 2);
  return { lineWidth, leftIndentPerLine };
};

const getScoreCircle = ({
  lineBreakingNodes,
  lineWidth,
}: {
  lineBreakingNodes: LineBreakingNode[];
  lineWidth: number[];
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
    maxAttempts: 50,
    scoreFunc: getScoreCircle,
    func: (x) => {
      let { lineWidth, leftIndentPerLine } = circleLineWidths(
        x,
        obj.options.lineHeight!
      );
      const lineBreakingNodes: LineBreakingNode[] = breakLines(
        obj.items,
        {
          ...obj.options,
          lineWidth,
          // maxLines: lineWidth.length,
        },
        0
      ).lineBreakingNodes;
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
    return breakLines(obj.items, obj.options).breakpoints;
  }
}
