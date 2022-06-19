import { breakLines } from "src/breakLines";
import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import { LineWidth } from "src/utils/lineWidth";

export type ParagraphWithWidth = {
  input: string;
  lineWidth: LineWidth;
};

/** Wrap lines at an optimal width instead of the full width. */
export function texLinebreakMultiple(
  paragraphs: ParagraphWithWidth[],
  options: TexLinebreakOptions
): string[] {
  const paragraphObjects = paragraphs.map(
    (p) =>
      new TexLinebreak(p.input, {
        ...options,
        lineWidth: p.lineWidth,
      })
  );

  let minRemainingWidth = Infinity;

  paragraphObjects.forEach((t) => {
    t.options.infiniteGlueStretchAsRatioOfWidth = 0;
    const remainingWidth = Math.min(
      t.lines.map((l) => l.remainingWidth).reduce((a, b) => a + b)
    );
    minRemainingWidth = Math.min(minRemainingWidth, remainingWidth);
  });

  breakpoints = breakLines(allItems, {
    makeSmallerBy: optimalWidthIsSmallerBy,
  }).breakpoints;

  let itemIndex = 0;
  return paragraphsSplitIntoItems.map((items) => {
    let lines: string[] = [""];
    items.forEach((chunk) => {
      if (breakpoints.includes(itemIndex++)) {
        lines.push("");
      }
      lines.at(-1) += chunk.text || "";
    });
    return lines.map((k) => k.trim()).join("\n");
  });
}
