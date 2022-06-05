import { TexLinebreak } from 'src/index';
import { TextItem } from 'src/utils/utils';

/**
 * @deprecated This function is deprecated due to the name being confusing,
 *   but it is kept for backwards compatibility.
 *   Please use {@link splitTextIntoItems} instead.
 *
 * A convenience function that generates a set of input items for
 *   `breakLines` from a string.
 * @param input - Text to process
 * @param measureFn - Callback that calculates the width of a given string
 * @param hyphenateFn - Callback that calculates legal hyphenation points in words and
 *       returns an array of pieces that can be joined with hyphens.
 */
export function layoutItemsFromString(
  input: string,
  measureFn: (word: string) => number,
  hyphenateFn?: (word: string) => string[],
): TextItem[] {
  return new TexLinebreak<TextItem>(input, {
    measureFn,
    hyphenateFn,
    /** Not important for this step */ lineWidth: [],
  }).items;
}
