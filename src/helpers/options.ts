import { TextInputItem } from 'src/helpers/util';
import { Item, LineBreakingOptions, defaultLineBreakingOptions } from 'src/breakLines';
import { DOMItem } from 'src/html/getItemsFromDOM';
import { LineWidth } from 'src/html/lineWidth';

export type TexLinebreakOptions = Partial<
  {
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
  } & LineBreakingOptions
>;

const defaultOptions: Partial<TexLinebreakOptions> = {
  lineBreakingType: 'fullWidth',
  keepNewlines: false,
  keepNewlinesAfter: /[.:?!\\]$/,
  alignment: 'justify',
  hangingPunctuation: true,
  addParagraphEnd: true,
  // /** If no callback is provided, default to a monospace */
  // measureFn: (word: string) => word.length,

  ...defaultLineBreakingOptions,
};

export const getOptionsWithDefaults = (options: TexLinebreakOptions): TexLinebreakOptions => {
  // todo: validation
  return { ...defaultOptions, ...options };
};

// export type HelperOptionsRequiredFromUser = HelperOptions &
//   Required<Pick<HelperOptions, 'lineWidth'>>;
