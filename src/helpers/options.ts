import { LineWidth } from 'src/html/lineWidth';

export type TexLinebreakOptions = Partial<{
  /**
   * Can be a number (when the line width is the same for the entire paragraph), or,
   * when the line width varies for each line, an array of numbers or an object.
   */
  lineWidth: LineWidth;

  /**
   * - `normal` fills the entire allowed width, with the the last line of each
   *   paragraph being allowed to end with a significant amount of space.
   * - `findOptimalWidth` will shrink the paragraph's width until ... TODO
   * - `compact` will shrink each paragraph independently so all lines (including
   *   the last line) are aligned.
   * - `greedy` will break greedily instead of using TeX's line breaking algorithm.
   *
   * @default `normal`
   */
  lineBreakingType: 'normal' | 'findOptimalWidth' | 'compact' | 'greedy';

  /** @default `justify` */
  alignment: 'justify' | 'left' /*| 'right' | 'center'*/;

  /** Ratio compared to a normal space */
  renderLineAsLeftAlignedIfSpaceIsLargerThan: number;

  /** If alignment is `left`, we can still allow the glue to stretch a bit. */
  leftAlignmentStretchinessFactor: number;

  /**
   * Function that calculates the width of a given string.
   * For DOM elements, this can be done with {@link DOMTextMeasurer} which draws the text to
   * a canvas. This function called for every item, so you may wish to cache your output.
   */
  measureFn: (word: string) => number;

  /**
   * Function that calculates legal hyphenation points in a word and
   * returns an array of pieces that can be joined with hyphens.
   */
  hyphenateFn: (word: string) => string[];

  /** @default true */
  hangingPunctuation: boolean;

  /**
   * If the lineBreakingType option is set to `findOptimalWidth` or
   * `compact`, this value may be used to set a lower limit for the width.
   */
  minWidth: number;

  /**
   * HTML content collapses all whitespace and displays it as a single space.
   *
   * @default true
   */
  collapseNewlines: boolean;

  keepNewlinesAfter: (string | RegExp) | (string | RegExp)[];
  prohibitBreakingOn: (string | RegExp) | (string | RegExp)[];

  /** @default true */
  addInfiniteGlueToTheEndOfTheLine: boolean;
  addParagraphEnd: boolean;

  overflow: 'break' | 'truncate' | 'ellipsis';

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
  maxAdjustmentRatio: number | null;

  /**
   * The maximum adjustment ratio used for the initial line breaking attempt.
   *
   * @default 0
   */
  initialMaxAdjustmentRatio: number;

  /**
   * Penalty for consecutive hyphenated lines.
   * A value between 0 <= n <= MAX_COST.
   *
   * @default 0
   */
  doubleHyphenPenalty: number;

  /**
   * Penalty for breaking on soft hyphens.
   *
   * A value between 0 <= n <= MAX_COST (which is 1,000).
   * A value over 40 will only break on long words.
   * A value of MAX_COST - 1 will break on long words.
   *
   * @default 10
   */
  softHyphenationPenalty: number;

  /**
   * Penalty for significant differences in the tightness of adjacent lines.
   *
   * @default 0
   */
  adjacentLooseTightPenalty: number;
}>;

const defaultOptions: TexLinebreakOptions = {
  lineBreakingType: 'normal',
  keepNewlinesAfter: /[.:?!\\]$/,
  alignment: 'justify',
  hangingPunctuation: true,
  addInfiniteGlueToTheEndOfTheLine: true,
  addParagraphEnd: true,
  collapseNewlines: true,
  /** If no callback is provided, default to a monospace */
  measureFn: (word: string) => word.length,
  maxAdjustmentRatio: null,
  initialMaxAdjustmentRatio: 1,
  doubleHyphenPenalty: 0,
  adjacentLooseTightPenalty: 0,
} as const;

export const getOptionsWithDefaults = (
  options: TexLinebreakOptions = {},
): RequireCertainKeys<TexLinebreakOptions, keyof typeof defaultOptions> => {
  // todo: validation
  return {
    ...(defaultOptions as RequireCertainKeys<TexLinebreakOptions, keyof typeof defaultOptions>),
    ...options,
  };
};

type RequireCertainKeys<T, TRequired extends keyof T> = T & Required<Pick<T, TRequired>>;
