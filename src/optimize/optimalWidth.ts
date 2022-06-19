import { breakLines } from "src/breakLines";
import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import { getLineWidth, LineWidth } from "src/utils/lineWidth";

export type ParagraphWithWidth = {
  input: string;
  lineWidth: LineWidth;
};

/**
 * Find the optimal width for multiple paragraphs
 */
export function texLinebreakMultiple(
  paragraphs: ParagraphWithWidth[],
  options: Partial<TexLinebreakOptions> = {}
): TexLinebreak[] {
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
  const remainingWidthsOfEachParagraph = paragraphObjects.map((p) =>
    getRemainingWidth(p, { infiniteGlueStretchAsRatioOfWidth: 0 })
  );
  const minRemainingWidth = Math.min(...remainingWidthsOfEachParagraph, 0);

  return paragraphObjects.map((t) => {
    // t.options.infiniteGlueStretchAsRatioOfWidth = 0;
    t.options.makeLineWidthSmallerBy = minRemainingWidth;
    return t;
  });
}

/* Gets the remaining width for a single paragraph */
export function getRemainingWidth(
  paragraphObject: TexLinebreak,
  options: Partial<TexLinebreakOptions>
): number {
  const nodes = breakLines(paragraphObject.items, {
    ...paragraphObject.options,
    ...options,
  }).lineBreakingNodes;
  let minRemainingWidth = Infinity;
  for (let i = 1; i < nodes.length; i++) {
    const width = nodes[i].totalWidth - nodes[i - 1].totalWidth;
    const remainingWidth =
      getLineWidth(paragraphObject.options.lineWidth, i - 1) - width;
    minRemainingWidth = Math.min(
      minRemainingWidth,
      Math.max(0, remainingWidth)
    );
  }
  return minRemainingWidth;
}
