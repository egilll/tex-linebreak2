import { Box, Glue, Item, MAX_COST, MIN_COST, Penalty } from 'src/breakLines';
import { LineWidth } from 'src/html/lineWidth';
import { TexLinebreakOptions } from 'src/options';

export interface TextBox extends Box {
  text?: string;
}

export interface TextGlue extends Glue {
  text?: string;
}

export type TextItem = TextBox | TextGlue | Penalty;

export function box(width: number): Box;
export function box(width: number, text: string): TextBox;
export function box(width: number, text?: string): Box | TextBox {
  return { type: 'box', width, text };
}

/** (Stretch comes before shrink as in the original paper) */
export function glue(
  width: number,
  stretch: number,
  shrink: number,
  text?: string,
): Glue | TextGlue {
  if (text) {
    return { type: 'glue', width, shrink, stretch, text };
  } else {
    return { type: 'glue', width, shrink, stretch };
  }
}

export function penalty(width: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width, cost, flagged };
}

export function textBox(text: string, options: TexLinebreakOptions): TextBox {
  return box(options.measureFn(text), text);
}

export function textGlue(text: string, options: TexLinebreakOptions): TextItem[] {
  const spaceShrink = getSpaceWidth(options) * options.glueShrinkFactor;
  const spaceStretch = getSpaceWidth(options) * options.glueStretchFactor;
  if (options.justify) {
    /** Spaces in justified lines */
    return [glue(getSpaceWidth(options), spaceStretch, spaceShrink, text)];
  } else {
    /**
     * Spaces in ragged lines. See p. 1139.
     * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
     * (Todo: Ragged line spaces should perhaps be allowed to stretch
     * a bit, but it should probably still be listed as zero here since
     * otherwise a line with many spaces is more likely to be a good fit.)
     */
    return [
      glue(0, getLineFinalStretchInNonJustified(options) + spaceStretch, spaceShrink, text),
      penalty(0, 0),
      glue(getSpaceWidth(options), -getLineFinalStretchInNonJustified(options), 0),
    ];
  }
}

export const softHyphen = (options: TexLinebreakOptions): TextItem[] => {
  const hyphenWidth = options.hangingPunctuation ? 0 : options.measureFn('-');
  if (options.justify) {
    return [penalty(hyphenWidth, options.softHyphenPenalty, true)];
  } else {
    /**
     * Optional hyphenations in unjustified text are slightly tricky as:
     * "After the breakpoints have been chosen using the above sequences
     * for spaces and for optional hyphens, the individual lines
     * should not actually be justified, since a hyphen inserted by the
     * ‘penalty(6,500,1)’ would otherwise appear at the right margin." (p. 1139)
     */
    return [
      penalty(0, MAX_COST),
      glue(0, getLineFinalStretchInNonJustified(options), 0),
      penalty(hyphenWidth, options.softHyphenPenalty, true),
      glue(0, -getLineFinalStretchInNonJustified(options), 0),
    ];
  }
};

export const getSpaceWidth = (options: TexLinebreakOptions): number => {
  return options.measureFn(' ');
};
export const getLineFinalStretchInNonJustified = (options: TexLinebreakOptions): number => {
  return getSpaceWidth(options) * options.lineFinalSpacesInNonJustified;
};

/** Todo: Should regular hyphens not be flagged? If so this function doesn't work */
export const isSoftHyphen = (item: Item | undefined): boolean => {
  // Note: Do not take width into account here as it will be zero for hanging punctuation
  return Boolean(item && item.type === 'penalty' && item.flagged);
};

export function forcedBreak(): Penalty {
  return penalty(0, MIN_COST);
}

/**
 * Used to prevent the last line from having a hanging last line.
 * Note: This results in the paragraph not filling the entire
 * allowed width, but the output will have all lines balanced.
 */
export const removeGlueFromEndOfParagraphs = <T extends Item>(items: T[]): T[] => {
  return items.slice().filter((item) => !(item.type === 'glue' && item.stretch === MAX_COST));
};

export function isForcedBreak(item: Item) {
  return item.type === 'penalty' && item.cost <= MIN_COST;
}

export const isBreakablePenalty = (item: Item) => {
  return item.type === 'penalty' && item.cost < MAX_COST;
};

export const isPenaltyThatDoesNotForceBreak = (item: Item) => {
  return item.type === 'penalty' && item.cost > MIN_COST;
};

/** TODO: Needs rework */
export const forciblySplitLongWords = (
  items: TextItem[],
  options: TexLinebreakOptions,
): TextItem[] => {
  return items;
  // if (options.lineWidth == null) {
  //   throw new Error('lineWidth must be set');
  // }
  // let output: TextItem[] = [];
  // const minLineWidth = getMinLineWidth(options.lineWidth);
  // items.forEach((item) => {
  //   if (item.type === 'box' && item.width > minLineWidth) {
  //     for (let i = 0; i < item.text.length; i++) {
  //       const char = item.text[i];
  //       /** Add penalty */
  //       // Separators
  //       if (/\p{General_Category=Z}/u.test(char)) {
  //         output.push(penalty(0, 0));
  //       }
  //       // Punctuation
  //       else if (/\p{General_Category=P}/u.test(char)) {
  //         output.push(penalty(0, 0));
  //       } else {
  //         output.push(penalty(0, 999));
  //       }
  //       /** Add glue */
  //       output.push(textBox(char, options));
  //     }
  //   } else {
  //     output.push(item);
  //   }
  // });
  // return output;
};

export const getMinLineWidth = (lineWidths: LineWidth): number => {
  if (Array.isArray(lineWidths)) {
    return Math.min(...lineWidths);
  } else if (typeof lineWidths === 'number') {
    return lineWidths;
  } else {
    return Math.min(...[...Object.values(lineWidths), lineWidths.defaultLineWidth]);
  }
};

export const getLineWidth = (lineWidths: LineWidth, lineIndex: number): number => {
  if (Array.isArray(lineWidths)) {
    if (lineIndex < lineWidths.length) {
      return lineWidths[lineIndex];
    } else {
      /**
       * If out of bounds, return the last width of the last line.
       * This is done since the first line may have indentation.
       */
      return lineWidths.at(-1)!;
    }
  } else if (typeof lineWidths === 'number') {
    return lineWidths;
  } else {
    return lineWidths[lineIndex] || lineWidths.defaultLineWidth;
  }
};

export const validateItems = (items: Item[]) => {
  /** Input has to end in a MIN_COST penalty */
  const lastItem = items[items.length - 1];
  if (!(lastItem.type === 'penalty' && lastItem.cost <= MIN_COST)) {
    throw new Error(
      "The last item in breakLines must be a penalty of MIN_COST, otherwise the last line will not be broken. `splitTextIntoItems` will automatically as long as the `addParagraphEnd` option hasn't been turned off.",
    );
  }

  // /** A glue cannot be followed by a non-MIN_COST penalty */
  // const glueFollowedByNonMinCostPenalty = items.find(
  //   (item, index) =>
  //     item.type === 'glue' &&
  //     items[index + 1].type === 'penalty' &&
  //     (items[index + 1] as Penalty).cost! > MIN_COST,
  // );
  // if (glueFollowedByNonMinCostPenalty) {
  //   console.log({ items });
  //   throw new Error(
  //     `A glue cannot be followed by a penalty with a cost greater than MIN_COST. If you're trying to penalize a glue, make the penalty come before it. Found at index ${items.findIndex(
  //       (i) => i === glueFollowedByNonMinCostPenalty,
  //     )}`,
  //   );
  // }

  /** Validate values */
  if (items.some((item) => !item.type)) {
    throw new Error(`Missing type for item: ${JSON.stringify(items.find((item) => !item.type))}`);
  }
  if (items.some((item) => typeof item.width !== 'number')) {
    throw new Error(`Width must be a number: ${JSON.stringify(items.find((item) => !item.type))}`);
  }
};
