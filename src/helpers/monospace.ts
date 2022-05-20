import { TextInputItem } from 'src/helpers/helpers';
import { MAX_COST, MIN_COST } from 'src/layout';

type Options = {
  lineBreakingType: 'findOptimalWidth' | 'fullWidth' | 'greedy';
  maxWidth: number;
  /** Only applicable to lineBreakingType 'findOptimalWidth' */
  minWidth?: number;
  keepNewlines?: boolean;
  keepNewlinesAfter?: RegExp;
  dontBreakOnSpacesMatching?: (
    textBeforeSpace: string | undefined,
    textAfterSpace: string | undefined,
  ) => boolean;
};
export const optionsDefaults: Partial<Options> = {
  lineBreakingType: 'fullWidth',
  keepNewlines: false,
  keepNewlinesAfter: /[.:?!\\]$/,
};

export function splitIntoItems(input: string, options: Options): TextInputItem[];
export function splitIntoItems(input: string[], options: Options): TextInputItem[][];
export function splitIntoItems(
  input: string | string[],
  options: Options,
): TextInputItem[] | TextInputItem[][] {
  if (Array.isArray(input)) {
    return input.map((i) => splitIntoItems(i, options));
  }

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
      items.push({
        type: 'glue',
        width: 0,
        text: '',
        shrink: 0,
        stretch: MAX_COST,
      });
      items.push({ type: 'penalty', cost: MIN_COST, width: 0, flagged: false });
    } else if (
      (chunk === ' ' || chunk === '\n') &&
      !options.dontBreakOnSpacesMatching?.(chunks[index - 1], chunks[index + 1])
    ) {
      /** Space */
      items.push({
        type: 'glue',
        width: 1,
        text: ' ',
        shrink: 1,
        stretch: 1,
      });
    } else {
      /** Word */
      items.push({
        type: 'box',
        width: chunk.length,
        text: chunk,
      });
    }
  });
  items.push({
    type: 'glue',
    width: 0,
    shrink: 0,
    stretch: MAX_COST,
    text: '',
  });
  items.push({ type: 'penalty', cost: MIN_COST, width: 0, flagged: false });
  return items;
}
