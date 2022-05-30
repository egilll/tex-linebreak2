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

  /**
   * Function that calculates the width of a given string.
   * For DOM elements, this can be done with {@link DOMTextMeasurer} which draws the text
   * to a canvas. This function called for every item, you may wish to cache your output.
   */
  measureFn: (word: string) => number;
  /**
   * Function that calculates legal hyphenation points in a word and
   * returns an array of pieces that can be joined with hyphens.
   */
  hyphenateFn: (word: string) => string[];

  /**
   * A value between 0 <= n <= MAX_COST (which is 1,000).
   * Default is 10.
   * A value over 40 will only break on long words.
   * A value of MAX_COST will never break, but a value of
   * MAX_COST - 1 will still break on long words.
   */
  softHyphenationPenalty: number;

  /** @default true */
  hangingPunctuation: boolean;

  /** Only applicable to lineBreakingType 'findOptimalWidth' */
  minWidth: number;

  keepNewlines: boolean;
  keepNewlinesAfter: RegExp;
  dontBreakOnSpacesMatching: (
    textBeforeSpace: string | undefined,
    textAfterSpace: string | undefined,
  ) => boolean;

  /** HTML content does not mind newlines */
  isHTML: boolean;

  /** Ratio compared to a normal space */
  renderLineAsLeftAlignedIfSpaceIsLargerThan: number;

  addParagraphEnd: boolean;

  overflow: 'break' | 'truncate' | 'ellipsis';

  /**
   * A factor indicating the maximum amount by which items in a line can be spaced
   * out by expanding `Glue` items.
   *
   * The maximum size which a `Glue` on a line can expand to is `glue.width +
   * (maxAdjustmentRatio * glue.stretch)`.
   *
   * If the paragraph cannot be laid out without exceeding this threshold then a
   * `MaxAdjustmentExceededError` error is thrown. The caller can use this to apply
   * hyphenation and try again. If `null`, lines are stretched as far as necessary.
   */
  maxAdjustmentRatio: number | null;

  /** The maximum adjustment ratio used for the initial line breaking attempt. */
  initialMaxAdjustmentRatio: number;

  /** Penalty for consecutive hyphenated lines. */
  doubleHyphenPenalty: number;

  /** Penalty for significant differences in the tightness of adjacent lines. */
  adjacentLooseTightPenalty: number;
}>;

const defaultOptions: Partial<TexLinebreakOptions> = {
  lineBreakingType: 'normal',
  keepNewlines: false,
  keepNewlinesAfter: /[.:?!\\]$/,
  alignment: 'justify',
  hangingPunctuation: true,
  addParagraphEnd: true,
  /** If no callback is provided, default to a monospace */
  measureFn: (word: string) => word.length,
  maxAdjustmentRatio: null,
  initialMaxAdjustmentRatio: 1,
  doubleHyphenPenalty: 0,
  adjacentLooseTightPenalty: 0,
};

export const getOptionsWithDefaults = (options: TexLinebreakOptions): TexLinebreakOptions => {
  // todo: validation
  return { ...defaultOptions, ...options };
};
