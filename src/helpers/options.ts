export type HelperOptions = {
  text?: string;
  lineBreakingType?: 'fullWidth' | 'findOptimalWidth' | 'greedy';
  alignment?: 'justify' | 'left' | 'right' | 'center';
  lineWidth?: number;
  /** Only applicable to lineBreakingType 'findOptimalWidth' */
  minWidth?: number;
  keepNewlines?: boolean;
  keepNewlinesAfter?: RegExp;
  dontBreakOnSpacesMatching?: (
    textBeforeSpace: string | undefined,
    textAfterSpace: string | undefined,
  ) => boolean;
  /** Callback that calculates the width of a given string */
  measureFn: (word: string) => number;
  /**
   * Callback that calculates legal hyphenation points in
   * words and returns an array of pieces that can be joined
   * with hyphens.
   */
  hyphenateFn?: (word: string) => string[];
  hangingPunctuation?: boolean;

  /** HTML content does not mind newlines */
  ignoreNewlines?: boolean;
};

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

export type HelperOptionsRequiredFromUser = HelperOptions &
  Required<Pick<HelperOptions, 'lineWidth'>>;
