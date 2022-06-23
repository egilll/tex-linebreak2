import { TexLinebreak } from "src/index";
import {
  findOptimalWidth,
  ParagraphWithWidth,
} from "src/optimize/optimalWidth";
import { getOptionsWithDefaults, TexLinebreakOptions } from "src/options";

/**
 * Can be used to find the optimal width for multiple paragraphs
 */
export function texLinebreakMultiple(
  paragraphs: ParagraphWithWidth[],
  _options: Partial<TexLinebreakOptions> = {}
): TexLinebreak[] {
  const options = getOptionsWithDefaults(_options);

  /** We start by creating TexLinebreak objects for each paragraph */
  const paragraphObjects = paragraphs.map(
    (paragraph) =>
      new TexLinebreak(paragraph.input, {
        ...options,
        lineWidth: paragraph.lineWidth,
        // Prevent nested calls to `findOptimalWidth`
        findOptimalWidth: false,
      })
  );

  if (options.findOptimalWidth) {
    return findOptimalWidth(paragraphObjects, options);
  } else {
    return paragraphObjects;
  }
}
