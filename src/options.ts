import { LineWidth } from 'src/html/lineWidth';

export class TexLinebreakOptions {
  /**
   * Can be a number (when the line width is the same for
   * the entire paragraph), or, when the line width varies
   * for each line, an array of numbers or an object.
   */
  lineWidth!: LineWidth;

  /**
   * Function that calculates the width of a given string.
   * For DOM elements, this can be done with {@link DOMTextMeasurer}
   * which draws the text to a canvas. This function called for
   * every item, so you may wish to cache your output.
   */
  measureFn!: (word: string) => number;

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
   */
  lineBreakingType: 'normal' | 'findOptimalWidth' | 'compact' | 'greedy' = 'normal';

  justify: boolean = true;

  hangingPunctuation: boolean = true;

  /**
   * If the lineBreakingType option is set to `findOptimalWidth` or
   * `compact`, this value may be used to set a lower limit for the width.
   */
  minWidth?: number;

  /** HTML content collapses all whitespace and displays it as a single space. */
  collapseNewlines: boolean = true;

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
   */
  onlyBreakOnWhitespace: boolean = false;

  /**
   * Allows the last line of a paragraph to be shorter than the rest.
   * If set to false, the other lines will not fill the entire allowed width.
   */
  addInfiniteGlueToTheEndOfTheLine: boolean = true;

  /**
   * Adds a MIN_COST penalty to the end of the paragraph. Without
   * it, the paragraph cannot be broken. Only turn this option off if
   * you're adding text from inline elements to the overall paragraph;
   * the paragraph itself must always end with this penalty.
   */
  addParagraphEnd: boolean = true;

  /**
   * Whether to force words that are longer than the allowed width to
   * break, with the breakpoint being chosen at random (equivalent to
   * CSS's "word-wrap: break-word").
   * Turn this off if working with plaintext that a user will be copying.
   */
  forceOverflowToBreak: boolean = true;

  /**
   * The adjustment ratio of a line is the amount by which a line's glue
   * has been expanded or shrunk.
   *
   * An adjustment ratio of 0 means that all glue items are of their
   * preferred width. An adjustment ratio of 1 means that all glue items
   * have expanded by their full `stretch` value. An adjustment ratio of -1
   * means that all glue items have shrunk by their full `shrink` value.
   *
   * Setting `maxAdjustmentRatio` prohibits the line from expanding more
   * than `glue.width - (maxAdjustmentRatio * glue.stretch)`.
   *
   * If the paragraph cannot be laid out without exceeding this threshold
   * then a `MaxAdjustmentExceededError` error is thrown.
   * The caller can use this to apply hyphenation and try again.
   * If `null` (default), lines are stretched as far as necessary.
   */
  maxAdjustmentRatio: number | null = null;

  /** The maximum adjustment ratio used for the initial line breaking attempt. */
  initialMaxAdjustmentRatio: number = 0.2;

  /**
   * Penalty for consecutive hyphenated lines.
   * A value between 0 <= n <= MAX_COST.
   */
  doubleHyphenPenalty: number = 0;

  /**
   * Penalty for breaking on soft hyphens.
   *
   * A value between 0 <= n <= MAX_COST (which is 1,000).
   * A value over 40 will only break on long words.
   * A value of MAX_COST - 1 will break on long words.
   *
   * @default 50 for justified text, 500 for non-justified
   */
  softHyphenPenalty: number = 50;

  /** Penalty for significant differences in the tightness of adjacent lines. */
  adjacentLooseTightPenalty: number = 0;

  /**
   * Whether to allow a single long word that does not fill 100% of the allowed
   * width to occupy a line by itself, thus leaving behind space on its right
   * side. This setting does not apply to the last line of a paragraph.
   *
   * Note: This goes against Knuth & Plass's original paper, however without it
   * the output is extremely counter-intuitive. Several things may occur when
   * this option is turned off:
   *
   * 1. The word can overflow into the margin. The only possible solution would be
   *    to force breaks inside a word.
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
   * 3. The line will fail to break completely if lineWidth is some value
   * smaller than any word.
   *
   * To get the same output as Knuth & Plass's original paper, set this option
   * to `true`.
   */
  preventSingleWordLines: boolean = false;

  /**
   * How much can a glue stretch (at an adjustment ratio of 1)?
   *
   * A value of 0 means that the glue cannot shrink.
   * A value of 1 means that the glue can double in size
   *
   * @default - For justified: 1.2 - A glue can stretch by 120% (becoming 220% of its original size).
   *   - For unjustified: 0.3 - A glue can stretch by 30%
   */
  glueStretchFactor: number = 1.2;

  /**
   * How much can a glue shrink (at an adjustment ratio of 1)?
   *
   * Must be between 0 <= n <= 1.
   * A value of 0 means that the glue cannot shrink.
   * A value of 1 means that the glue can shrink to nothing.
   *
   * @default - 0.2 - A glue can shrink by 20%.
   *
   * The default value is also 0.2 for unjustified text,
   * however you may wish to set it to 0 if you wish to prevent
   * the paragraph from occasionally having a justified
   * appearance (see comments on p. 1131).
   */
  glueShrinkFactor: number = 0.2;

  /**
   * If you wish to prevent displaying excessively wide spaces between
   * words even when the paragraph cannot be broken otherwise, you
   * can set this option as a hard limit for how wide spaces can
   * actually be when displayed. This will cause lines that exceed
   * this adjustment ratio to be displayed as left aligned.
   */
  renderLineAsLeftAlignedIfAdjustmentRatioExceeds?: number;

  /**
   * Whether soft hyphens in the input text should be removed from the output
   * text. This is recommended for websites, as users can then copy the text
   * without being annoyed by the invisible soft hyphen characters.
   *
   * WORK IN PROGRESS (TODO): Does not currently work for websites!
   */
  stripSoftHyphensFromOutputText: boolean = true;

  /**
   * If a soft hyphen is chosen as a breakpoint, what character should be
   * used to display it?
   *
   * - 'HTML_UNCOPYABLE_HYPHEN' – Recommended for websites. Outputs a hyphen
   *   using CSS so that it will not be included in the user's output.
   * - 'HTML_UNCOPYABLE_HYPHEN_WITH_SOFT_HYPHEN' - Outputs a hyphen using
   *   CSS, but includes an invisible soft hyphen that will be included in
   *   the text that a user copies.
   * - 'HYPHEN' - Recommended for plain text. Will be included as an
   *   always-visible hyphen in the text that the user copies.
   * - 'SOFT_HYPHEN' - Outputs just a simple soft hyphen unicode character.
   *   This option should only be used if your
   *   intended output is a terminal emulator, see
   *   https://en.wikipedia.org/wiki/Soft_hyphen#Text_preformatted_by_the_originator
   *
   * @default 'HTML_UNCOPYABLE_HYPHEN' for websites, 'HYPHEN' for plain text.
   */
  softHyphenOutput:
    | 'HTML_UNCOPYABLE_HYPHEN'
    | 'HTML_UNCOPYABLE_HYPHEN_WITH_SOFT_HYPHEN'
    | 'HYPHEN'
    | 'SOFT_HYPHEN' = 'HTML_UNCOPYABLE_HYPHEN';

  /**
   * How many spaces should be allowed at the end of a
   * non-justified line given an adjustment ratio of 1?
   */
  lineFinalSpacesInNonJustified: number = 3;

  leftIndentPerLine?: TexLinebreakOptions['lineWidth'];

  /** ====================== End of options ====================== */

  constructor(options: Partial<TexLinebreakOptions> = {}) {
    if (options.justify === false) {
      this.softHyphenPenalty = 500;
      this.glueShrinkFactor = 0.2;
      this.glueStretchFactor = 0.3;
      this.renderLineAsLeftAlignedIfAdjustmentRatioExceeds = 1;
    }
    Object.assign(this, options);
  }
}

export const getOptionsWithDefaults = (
  options: Partial<TexLinebreakOptions>,
): TexLinebreakOptions => {
  if (options instanceof TexLinebreakOptions) {
    return options;
  } else {
    return new TexLinebreakOptions(options);
  }
};

export type RequireCertainKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type RequireOnlyCertainKeys<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;
export type OptionalCertainKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;