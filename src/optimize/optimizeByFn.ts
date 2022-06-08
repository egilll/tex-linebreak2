import { breakLines, LineBreakingNode } from "src/breakLines";
import { TexLinebreak } from "src/index";

const getLineWidths = (height: number, lineHeight: number) => {
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
  return (idealLineNumber - actualLineNumber) ** 2;
};

export const optimizeByFn = (obj: TexLinebreak): number[] => {
  obj.options.addInfiniteGlueToFinalLine = false;

  // const func = obj.options.optimizeByFn!;
  let numberOfLines = 30;
  let minNumberOfLines = 4;
  let lastDiff: number | null = null;
  const diffDeltaFactor = 0.6;

  let bestScore: number | null = null;
  let best;
  let bestNumberOfLines;

  for (let i = 0; i < 50; i++) {
    let { lineWidth, leftIndentPerLine } = getLineWidths(
      numberOfLines * obj.options.lineHeight!,
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
    const score = getScore(lineBreakingNodes, lineWidth);
    if (score > 0 && (bestScore == null || score < bestScore)) {
      bestScore = score;
      best = {
        lineWidth,
        leftIndentPerLine,
        lineBreakingNodes,
      };
      bestNumberOfLines = numberOfLines;
    }
    let diff: number = Math.abs(lastDiff || numberOfLines) * diffDeltaFactor;
    if (bestNumberOfLines) {
      diff *= numberOfLines - bestNumberOfLines >= 0 ? 1 : -1;
    }
    if (score < 0) {
      diff = Math.abs(diff);
    }

    // if (numberOfLines + diff < minNumberOfLines) {
    //   diff = minNumberOfLines - numberOfLines;
    // }
    diff = Math.abs(diff) < 1 ? Math.ceil(diff) : Math.round(diff);
    console.log({ numberOfLines, score, diff });

    if (diff === 0 || diff === lastDiff || (diff === 1 && lastDiff === 1)) {
      break;
    }

    numberOfLines += diff;
    lastDiff = diff;
  }
  if (best) {
    console.log({ bestScore, bestNumberOfLines });
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
