import { AllOptions } from 'src/types';
import { breakLines } from './lib/tex-linebreak';
import { ParagraphWithWidth, splitParagraphsIntoItems } from 'src/wrapLines/index';

/**
 * Wrap lines at an optimal width instead of the full width.
 */
export function balancedLineWrap(paragraphs: ParagraphWithWidth[], options: AllOptions): string[] {
  const paragraphsSplitIntoItems = splitParagraphsIntoItems(paragraphs, options);
  const allItems = paragraphsSplitIntoItems.flat();

  /**
   * First we break each paragraph into its smallest area,
   * in which the last line of each paragraph isn't allowed to have significant space.
   */
  const breakLinesCompact = breakLines(allItems, {
    compact: true,
  });
  const optimalWidthIsSmallerBy = breakLinesCompact.minRemainingSpaces;
  let breakpoints: number[];

  /**
   * If it would be optimal to make the width smaller,
   * we run the algorithm again with the new width.
   */
  if (
    optimalWidthIsSmallerBy > 0 &&
    /**
     * Disregard if there is only a single paragraph that doesn't have any newlines.
     * Then the output of the above will have been the optimal one.
     */
    (paragraphs.length > 0 ||
      /** Checks if there are any newlines inside the paragraphs */
      allItems.filter((c) => c.type === 'penalty').length > 1)
  ) {
    breakpoints = breakLines(allItems, {
      makeSmallerBy: optimalWidthIsSmallerBy,
    }).breakpoints;
  } else {
    breakpoints = breakLinesCompact.breakpoints;
  }

  let itemIndex = 0;
  return paragraphsSplitIntoItems.map((items) => {
    let lines: string[] = [''];
    items.forEach((chunk) => {
      if (breakpoints.includes(itemIndex++)) {
        lines.push('');
      }
      lines[lines.length - 1] += chunk.text || '';
    });
    return lines.map((k) => k.trim()).join('\n');
  });
}
