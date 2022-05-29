import { TextInputItem } from 'src/helpers/util';
import { Item } from 'src/breakLines';
import { DOMItem } from 'src/html/getItemsFromDOM';
import { LineWidth } from 'src/html/lineWidth';

export type HelperOptions = Partial<{
  text: string;
  lineBreakingType: 'fullWidth' | 'findOptimalWidth' | 'greedy';
  alignment: 'justify' | 'left' /*| 'right' | 'center'*/;
  lineWidth: LineWidth;
  /**
   * If the user wants to supply his own items
   */
  items: (TextInputItem | DOMItem | Item)[];

  /**
   * Callback that calculates the width of a given string.
   */
  measureFn: (word: string, ...args: any[]) => number;
  /**
   * Callback that calculates legal hyphenation points in a
   * word and returns an array of pieces that can be joined
   * with hyphens.
   */
  hyphenateFn: (word: string) => string[];

  /**
   * A value between 0 <= n <= MAX_COST (i.e. 1000).
   * Default is 10.
   * A value over 40 will only break on long words.
   * A value of MAX_COST will never break, but a value of MAX_COST - 1 will
   * still break on long words.
   */
  softHyphenationPenalty: number;

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

  /** ////////////////////////////////////////////
  //    Options used by {@link breakLines}     //
  /////////////////////////////////////////////*/

  /**
   * A factor indicating the maximum amount by which items in a line can be
   * spaced out by expanding `Glue` items.
   *
   * The maximum size which a `Glue` on a line can expand to is `glue.width +
   * (maxAdjustmentRatio * glue.stretch)`.
   *
   * If the paragraph cannot be laid out without exceeding this threshold then a
   * `MaxAdjustmentExceededError` error is thrown. The caller can use this to
   * apply hyphenation and try again. If `null`, lines are stretched as far as
   * necessary.
   */
  maxAdjustmentRatio: number | null;

  /**
   * The maximum adjustment ratio used for the initial line breaking attempt.
   */
  initialMaxAdjustmentRatio: number;

  /**
   * Penalty for consecutive hyphenated lines.
   */
  doubleHyphenPenalty: number;

  /**
   * Penalty for significant differences in the tightness of adjacent lines.
   */
  adjacentLooseTightPenalty: number;
}>;

export const helperOptionsDefaults: Partial<HelperOptions> = {
  lineBreakingType: 'fullWidth',
  keepNewlines: false,
  keepNewlinesAfter: /[.:?!\\]$/,
  alignment: 'justify',
  hangingPunctuation: true,
  addParagraphEnd: true,
  // /** If no callback is provided, default to a monospace */
  // measureFn: (word: string) => word.length,

  maxAdjustmentRatio: null,
  initialMaxAdjustmentRatio: 1,
  doubleHyphenPenalty: 0,
  adjacentLooseTightPenalty: 0,
};

export const getOptionsWithDefaults = (options: HelperOptions): HelperOptions => {
  // todo: validation
  return { ...helperOptionsDefaults, ...options };
};

// export type HelperOptionsRequiredFromUser = HelperOptions &
//   Required<Pick<HelperOptions, 'lineWidth'>>;
