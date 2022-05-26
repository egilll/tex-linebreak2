import { TextInputItem } from 'src/helpers/util';
import { DOMItem } from 'src/html/htmlHelpers';
import { InputItem } from 'src/breakLines';

export type HelperOptions = Partial<{
  text: string;
  lineBreakingType: 'fullWidth' | 'findOptimalWidth' | 'greedy';
  alignment: 'justify' | 'left' | 'right' | 'center';
  lineWidth: number;
  /**
   * If the user wants to supply his own items
   */
  items: (TextInputItem | DOMItem | InputItem)[];

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
   * A value of MAX_COST will never break, but a value of MAX_COST - 1 will still break on long words.
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
  ignoreNewlines: boolean;

  /** Ratio compared to a normal space */
  renderLineAsLeftAlignedIfSpaceIsLargerThan: number;
}>;

export const helperOptionsDefaults: Partial<HelperOptions> = {
  lineBreakingType: 'fullWidth',
  keepNewlines: false,
  keepNewlinesAfter: /[.:?!\\]$/,
  alignment: 'justify',
  hangingPunctuation: true,
  // /** If no callback is provided, default to a monospace */
  // measureFn: (word: string) => word.length,
};

export const getOptionsWithDefaults = (options: HelperOptions): HelperOptions => {
  // todo: validation
  return { ...helperOptionsDefaults, ...options };
};

// export type HelperOptionsRequiredFromUser = HelperOptions &
//   Required<Pick<HelperOptions, 'lineWidth'>>;
