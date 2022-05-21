import { TextInputItem, paragraphEnd, box, glue } from 'src/helpers/util';
import { HelperOptions } from 'src/helpers/options';
import UnicodeLineBreakingAlgorithm from 'linebreak';

UnicodeLineBreakingAlgorithm;

/**
 * A convenience function that generates a set of input items for `breakLines`
 * from a string.
 */
export function splitTextIntoItems(
  input: string,
  options: Partial<HelperOptions>,
): TextInputItem[] {
  let items: TextInputItem[] = [];

  /**
   * Split into 1. words (including their following punctuation) and 2. whitespace
   */
  const chunks = input
    /* Collapse spaces */
    .replace(/ +/g, ' ')
    /* Collapse spaces around newlines */
    .replace(/ ?\n ?/g, '\n')
    /* Split on spaces and newlines */
    .split(/([ \n])/)
    .filter((w) => w.length > 0);

  chunks.forEach((chunk, index) => {
    if (
      chunk === '\n' &&
      index > 0 &&
      (options.keepNewlines || options.keepNewlinesAfter?.test(chunks[index - 1]))
    ) {
      /** Keep newline after punctuation */
      items.push(...paragraphEnd());
    } else if (
      (chunk === ' ' || chunk === '\n') &&
      !options.dontBreakOnSpacesMatching?.(chunks[index - 1], chunks[index + 1])
    ) {
      /** Space */
      //TODO: Verify stretch values!
      items.push(glue(1, 1, 1, ' '));
    } else {
      /** Word */
      items.push(box(chunk.length, chunk));
    }
  });
  items.push(...paragraphEnd());
  return items;
}

/**
 * @deprecated
 *   This function is deprecated due to the name being confusing,
 *   but it is kept for backwards compatibility.
 *   Please use {@link splitTextIntoItems} instead.
 *
 * A convenience function that generates a set of input items for `breakLines`
 * from a string.
 *
 * @param input - Text to process
 * @param measureFn - Callback that calculates the width of a given string
 * @param hyphenateFn - Callback that calculates legal hyphenation points in
 *                      words and returns an array of pieces that can be joined
 *                      with hyphens.
 */
export function layoutItemsFromString(
  input: string,
  measureFn: (word: string) => number,
  hyphenateFn?: (word: string) => string[],
): TextInputItem[] {
  return splitTextIntoItems(input, {
    measureFn,
    hyphenateFn,
  });
  // const items: TextInputItem[] = [];
  // const chunks = s.split(/(\s+)/).filter((w) => w.length > 0);
  //
  // // Here we assume that every space has the same default size. Callers who want
  // // more flexibility can use the lower-level functions.
  // const spaceWidth = measureFn(' ');
  // const hyphenWidth = measureFn('-');
  // const isSpace = (word: string) => /\s/.test(word.charAt(0));
  //
  // const shrink = Math.max(0, spaceWidth - 2);
  // chunks.forEach((w) => {
  //   if (isSpace(w)) {
  //     const g: TextGlue = {
  //       type: 'glue',
  //       width: spaceWidth,
  //       shrink,
  //       stretch: spaceWidth * 1.5,
  //       text: w,
  //     };
  //     items.push(g);
  //     return;
  //   }
  //
  //   if (hyphenateFn) {
  //     const chunks = hyphenateFn(w);
  //     chunks.forEach((c, i) => {
  //       const b: TextBox = { type: 'box', width: measureFn(c), text: c };
  //       items.push(b);
  //       if (i < chunks.length - 1) {
  //         const hyphen: Penalty = { type: 'penalty', width: hyphenWidth, cost: 10, flagged: true };
  //         items.push(hyphen);
  //       }
  //     });
  //   } else {
  //     const b: TextBox = { type: 'box', width: measureFn(w), text: w };
  //     items.push(b);
  //   }
  // });
  // // Add "finishing glue" to space out final line.
  // items.push({ type: 'glue', width: 0, stretch: MAX_COST, shrink: 0, text: '' });
  // items.push(forcedBreak());
  //
  // return items;
}
