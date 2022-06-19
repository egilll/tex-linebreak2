import { breakLines } from "src/breakLines";
import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import {
  getLineWidth,
  LineWidth,
  makeLineWidthSmallerBy,
} from "src/utils/lineWidth";

export type ParagraphWithWidth = {
  input: string;
  lineWidth: LineWidth;
};

/** Wrap lines at an optimal width instead of the full width. */
export function texLinebreakMultiple(
  paragraphs: ParagraphWithWidth[],
  options: Partial<TexLinebreakOptions> = {}
): TexLinebreak[] {
  const paragraphObjects = paragraphs.map(
    (p) =>
      new TexLinebreak(p.input, {
        ...options,
        lineWidth: p.lineWidth,
      })
  );

  let minRemainingWidth = Infinity;

  paragraphObjects.forEach((t) => {
    const nodes = breakLines(
      t.items,
      { ...t.options, infiniteGlueStretchAsRatioOfWidth: 0 },
      0
    ).lineBreakingNodes;
    for (let i = 1; i < nodes.length; i++) {
      const width = nodes[i].totalWidth - nodes[i - 1].totalWidth;
      const remainingWidth = getLineWidth(t.options.lineWidth, i - 1) - width;
      minRemainingWidth = Math.min(minRemainingWidth, remainingWidth);
    }
  });

  return paragraphObjects.map((t) => {
    // t.options.infiniteGlueStretchAsRatioOfWidth = 0;
    t.options.lineWidth = makeLineWidthSmallerBy(
      t.options.lineWidth,
      isFinite(minRemainingWidth) ? minRemainingWidth : 0
    );
    return t;
  });
}
