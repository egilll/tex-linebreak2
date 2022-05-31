import { LineWidth } from 'src/html/lineWidth';

export interface TexLinebreakOptions {
  /**
   * Can be a number (when the line width is the same for
   * the entire paragraph), or, when the line width varies
   * for each line, an array of numbers or an object.
   */
  lineWidth: LineWidth;

  /**
   * Function that calculates the width of a given string.
   * For DOM elements, this can be done with {@link DOMTextMeasurer}
   * which draws the text to a canvas. This function called for
   * every item, so you may wish to cache your output.
   */
  measureFn: (word: string) => number;

  /**
   * Function that calculates legal hyphenation points in a word and
   * returns an array of pieces that can be joined with hyphens.
   */
  hyphenateFn?: (word: string) => string[];

  /**
   * - `normal` fills the entire allowed width, with the the last line of each
   *   paragraph being allowed to end with a significant amount of space.
   * - `findOptimalWidth` will shrink the paragraph's width until ... TODO
   * - `compact` will shrink each paragraph independently so all lines
   *   (including the last line) are aligned.
   * - `greedy` will break greedily instead of using TeX's line breaking
   *   algorithm.
   *
   * @default `normal`
   */
  lineBreakingType?: 'normal' | 'findOptimalWidth' | 'compact' | 'greedy';

  /** @default `justify` */
  alignment?: 'justify' | 'left' /*| 'right' | 'center'*/;

  /** Ratio compared to a normal space */
  renderLineAsLeftAlignedIfSpaceIsLargerThan?: number;

  /** If alignment is `left`, we can still allow the glue to stretch a bit. */
  leftAlignmentStretchinessFactor?: number;

  /** @default true */
  hangingPunctuation?: boolean;

  /**
   * If the lineBreakingType option is set to `findOptimalWidth` or
   * `compact`, this value may be used to set a lower limit for the width.
   */
  minWidth?: number;

  /**
   * HTML content collapses all whitespace and displays it as a single space.
   *
   * @default true
   */
  collapseNewlines?: boolean;

  keepNewlinesAfter?: (string | RegExp) | (string | RegExp)[];

  /**
   * A pattern that should never be broken.
   * Example: /{.+?}/ will never break inside curly braces.
   */
  neverBreakInside?: (string | RegExp) | (string | RegExp)[];

  /**
   * Never break a line after a certain string or pattern.
   * Example: ['-', 'e.g.'] will never break after a hyphen or the text 'e.g.'.
   */
  neverBreakAfter?: (string | RegExp) | (string | RegExp)[];

  /**
   * If you're breaking the lines of plaintext that a user may have to
   * copy later, you can use this option to only break on whitespace, and
   * never inside words that include hyphens or slashes (such as URLs).
   *
   * @default false
   */
  onlyBreakOnWhitespace?: boolean;

  /**
   * Allows the last line of a paragraph to be shorter than the rest.
   * If set to false, the other lines will not fill the entire allowed width.
   *
   * @default true
   */
  addInfiniteGlueToTheEndOfTheLine?: boolean;

  /**
   * Adds a MIN_COST penalty to the end of the paragraph. Without it,
   * the paragraph cannot be broken. Turn this option off if you're
   * adding text from inline elements to the overall paragraph.
   *
   * @default true
   */
  addParagraphEnd?: boolean;

  /**
   * Whether to force words that are longer than the allowed width to
   * break, with the breakpoint being chosen at random (equivalent to
   * CSS's "word-wrap: break-word").
   * Turn this off if working with plaintext that a user will be copying.
   *
   * @default true
   */
  forceOverflowToBreak?: boolean;

  /**
   * A factor indicating the maximum amount by which items in a
   * line can be spaced out by expanding `Glue` items.
   *
   * The maximum size which a `Glue` on a line can expand to is
   * `glue.width + (maxAdjustmentRatio * glue.stretch)`.
   *
   * If the paragraph cannot be laid out without exceeding this
   * threshold then a `MaxAdjustmentExceededError` error is thrown.
   * The caller can use this to apply hyphenation and try again. If
   * `null`, lines are stretched as far as necessary.
   *
   * @default null
   */
  maxAdjustmentRatio?: number | null;

  /**
   * The maximum adjustment ratio used for the initial line breaking attempt.
   *
   * @default 0
   */
  initialMaxAdjustmentRatio?: number;

  /**
   * Penalty for consecutive hyphenated lines.
   * A value between 0 <= n <= MAX_COST.
   *
   * @default 0
   */
  doubleHyphenPenalty?: number;

  /**
   * Penalty for breaking on soft hyphens.
   *
   * A value between 0 <= n <= MAX_COST (which is 1,000).
   * A value over 40 will only break on long words.
   * A value of MAX_COST - 1 will break on long words.
   *
   * @default 10
   */
  softHyphenPenalty?: number;

  /**
   * Penalty for significant differences in the tightness of adjacent lines.
   *
   * @default 0
   */
  adjacentLooseTightPenalty?: number;

  /**
   * Whether to allow a single long word that does not fill 100% of the allowed
   * width to occupy a line by itself, thus leaving behind space on its right
   * side.
   *
   * Note: This goes against Knuth & Plass's original paper, however without it
   * the output is extremely counter-intuitive. Two things can occur when this
   * option is turned off:
   *
   * 1. The word can OVERLAP with the next one.The only possible solution would be
   *    to allow a forced break inside a word or to allow the text to overflow.
   * 2. The line may be split in an extremely silly manner, such as:
   *
   *        bla         bla          bla
   *        bla https://example.com/bla/
   *        bla
   *
   * Instead of:
   *
   *        bla     bla     bla      bla
   *        https://example.com/bla/bla
   *
   * To get the same output as Knuth & Plass's original paper, set this option
   * to `false`.
   *
   * @default true
   */
  allowSingleWordLines?: boolean;
}

const defaultOptions: Partial<TexLinebreakOptions> = {
  lineBreakingType: 'normal',
  // keepNewlinesAfter: /[.:?!\\]$/,
  alignment: 'justify',
  hangingPunctuation: true,
  addInfiniteGlueToTheEndOfTheLine: true,
  addParagraphEnd: true,
  collapseNewlines: true,
  maxAdjustmentRatio: null,
  initialMaxAdjustmentRatio: 1,
  doubleHyphenPenalty: 0,
  adjacentLooseTightPenalty: 0,
  onlyBreakOnWhitespace: false,
  forceOverflowToBreak: true,
  allowSingleWordLines: true,
} as const;

export const getOptionsWithDefaults = (
  options: Partial<TexLinebreakOptions> = {},
): RequireCertainKeys<TexLinebreakOptions, keyof typeof defaultOptions> => {
  // todo: validation
  return {
    ...(defaultOptions as RequireCertainKeys<TexLinebreakOptions, keyof typeof defaultOptions>),
    ...options,
  };
};

export type RequireCertainKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type OptionalCertainKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
