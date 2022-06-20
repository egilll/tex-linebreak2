import { breakLines, LineBreakingNode } from "src/breakLines";
import { TexLinebreak } from "src/index";
import { FindBestWalkingIncreasing } from "src/optimize/findBestWalking";
import { TexLinebreakOptions } from "src/options";
import { getLineWidth, getMaxLineWidth, LineWidth } from "src/utils/lineWidth";

export type ParagraphWithWidth = {
  input: string;
  lineWidth: LineWidth;
};

export class TexLinebreakOptimalWidthOptions extends TexLinebreakOptions {
  maxExtraLinesPerParagraph: number | null = 0;
  constructor(options: Partial<TexLinebreakOptimalWidthOptions> = {}) {
    super(options);
    Object.assign(this, options);
  }
}

/**
 * Find the optimal width for multiple paragraphs
 */
export function texLinebreakMultiple(
  paragraphs: ParagraphWithWidth[],
  _options: Partial<TexLinebreakOptimalWidthOptions> = {}
): TexLinebreak[] {
  const options = new TexLinebreakOptimalWidthOptions(_options);

  /** We start by creating TexLinebreak objects for each paragraph */
  const paragraphObjects = paragraphs.map(
    (paragraph) =>
      new TexLinebreak(paragraph.input, {
        ...options,
        lineWidth: paragraph.lineWidth,
      })
  );

  /**
   * If we remove the infinite glue, the lines will try to fit the most compact way possible
   * (without going to the next line).
   * This gives us a good starting point of sizes to try out.
   */
  const remainingWidthsOfEachParagraph: number[] = [];
  const numberOfLinesInEachParagraph: number[] = [];
  paragraphObjects.forEach((paragraphObject) => {
    const nodes = breakLines(paragraphObject.items, {
      ...paragraphObject.options,
      infiniteGlueStretchAsRatioOfWidth: 0,
    }).lineBreakingNodes;
    remainingWidthsOfEachParagraph.push(
      getRemainingWidth(nodes, paragraphObject.options)
    );
    numberOfLinesInEachParagraph.push(nodes.length - 1);
  });
  const minRemainingWidth = Math.min(...remainingWidthsOfEachParagraph, 0);

  const minLineWidth = Math.min(
    ...paragraphObjects.map((p) => getMaxLineWidth(p.options.lineWidth))
  );
  const best = FindBestWalkingIncreasing({
    initialGuess: minRemainingWidth,
    min: minRemainingWidth,
    max: (minLineWidth - minRemainingWidth) * 0.5,
    initialStepSize: Math.ceil(minLineWidth * 0.1),
    minStepSize: 1,
    func: (makeSmallerBy) => {
      return paragraphObjects.map((paragraphObject) => {
        return breakLines(paragraphObject.items, {
          ...paragraphObject.options,
          // hmm..
          infiniteGlueStretchAsRatioOfWidth: 0.1,
          makeLineWidthSmallerBy: makeSmallerBy,
          initialMaxAdjustmentRatio: Infinity,
        }).lineBreakingNodes;
      });
    },
    scoreFunc: (allParagraphNodes: LineBreakingNode[][]) => {
      return allParagraphNodes
        .map((paragraphNodes, index) => {
          let demerits = paragraphNodes.at(-1)?.totalDemerits || 0;
          if (demerits === 0) {
            console.log(paragraphNodes.at(-1));
            throw new Error("");
          }
          const numberOfExtraLines =
            paragraphNodes.length - 1 - numberOfLinesInEachParagraph[index];
          if (numberOfExtraLines > 0) {
            demerits *= 2 * numberOfExtraLines ** 2;
          }
          if (
            options.maxExtraLinesPerParagraph != null &&
            numberOfExtraLines > options.maxExtraLinesPerParagraph
          ) {
            demerits = Infinity;
          }
          return demerits;
        })
        .reduce((a, b) => a + b, 0);
    },
    maxAttempts: 30,
  });

  return paragraphObjects.map((t) => {
    // t.options.infiniteGlueStretchAsRatioOfWidth = 0;
    t.options.makeLineWidthSmallerBy = best || minRemainingWidth;
    return t;
  });
}

/* Gets the remaining width for a single paragraph */
export function getRemainingWidth(
  nodes: LineBreakingNode[],
  options: Partial<TexLinebreakOptions>
): number {
  let minRemainingWidth = Infinity;
  for (let i = 1; i < nodes.length; i++) {
    const width = nodes[i].totalWidth - nodes[i - 1].totalWidth;
    const remainingWidth = getLineWidth(options.lineWidth!, i - 1) - width;
    minRemainingWidth = Math.min(
      minRemainingWidth,
      Math.max(0, remainingWidth)
    );
  }
  return minRemainingWidth;
}
