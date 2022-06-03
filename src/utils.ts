import { Box, Glue, Item, MAX_COST, MIN_COST, Penalty } from 'src/breakLines/breakLines';
import { DOMGlue, DOMItem } from 'src/html/getItemsFromDOM';
import { LineWidth } from 'src/html/lineWidth';
import { TexLinebreakOptions } from 'src/options';
import { PenaltyClasses } from 'src/splitTextIntoItems/penalty';

/** Useful when working with raw strings instead of DOM nodes. */
export interface TextBox extends Box {
  text: string;
}

export interface TextGlue extends Glue {
  text: string;
}

export type TextItem = TextBox | TextGlue | Penalty;

export function box(width: number): Box;
export function box(width: number, text: string): TextBox;
export function box(width: number, text?: string): Box | TextBox {
  return { type: 'box', width, text };
}
export function textBox(text: string, options: TexLinebreakOptions): TextBox {
  return box(options.measureFn(text), text);
}

export function glue(width: number, shrink: number, stretch: number): Glue;
export function glue(width: number, shrink: number, stretch: number, text: string): TextGlue;
export function glue(
  width: number,
  shrink: number,
  stretch: number,
  text?: string,
): Glue | TextGlue {
  if (text) {
    return { type: 'glue', width, shrink, stretch, text };
  } else {
    return { type: 'glue', width, shrink, stretch };
  }
}
export function textGlue(text: string, options: TexLinebreakOptions): TextGlue | TextItem[] {
  const spaceWidth = options.measureFn(' ');
  const spaceShrink = spaceWidth * options.glueShrinkFactor;
  const spaceStretch = spaceWidth * options.glueStretchFactor;
  if (options.justify) {
    /** Spaces in justified lines */
    return glue(spaceWidth, spaceShrink, spaceStretch, text);
  } else {
    /**
     * Spaces in ragged lines. See p. 1139.
     * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
     * (Todo: Ragged line spaces should perhaps be allowed to stretch
     * a bit, but it should probably still be listed as zero here since
     * otherwise a line with many spaces is more likely to be a good fit.)
     */
    const lineFinalStretch = 3 * spaceWidth;
    return [
      glue(0, 0, lineFinalStretch, text),
      penalty(0, 0),
      glue(spaceWidth, 0, -lineFinalStretch, text),
    ];
  }
}

export function penalty(width: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width, cost, flagged };
}

export const softHyphen = (options: TexLinebreakOptions) => {
  const hyphenWidth = options.hangingPunctuation ? 0 : options.measureFn('-');
  return penalty(hyphenWidth, options.softHyphenPenalty ?? PenaltyClasses.SoftHyphen, true);
  /**
   * Todo: Optional hyphenations in unjustified text, p 1139. Slightly
   * tricky as:
   * "After the breakpoints have been chosen using the above sequences
   * for spaces and for optional hyphens, the individual lines
   * should not actually be justified, since a hyphen inserted by the
   * ‘penalty(6,500,1)’ would otherwise appear at the right margin."
   */
};

/** Todo: Should regular hyphens not be flagged? If so this function doesn't work */
export const isSoftHyphen = (item: Item | undefined): boolean => {
  if (!item) return false;
  return Boolean(item.type === 'penalty' && item.flagged /*&& item.width > 0*/);
};

export function forcedBreak(): Penalty {
  return penalty(0, MIN_COST);
}

/**
 * Retrieves the text from an input item.
 * Text is included in {@link TextItem}s by {@link splitTextIntoItems}.
 */
export function itemToString(item: TextItem) {
  switch (item.type) {
    case 'box':
      return item.text;
    case 'glue':
      return ' '; // TODO: check
    case 'penalty':
      return item.flagged ? '-' : ''; // TODO: See comment in {@link lineStrings}
  }
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
  throw new Error('Not implemented');
};

/**
 * This is necessary in order to allow glue to stretch over
 * multiple text nodes, for example, the HTML "text <!--
 * comment node --> text" would otherwise become ["text", " ",
 * " ", "text"] and the glue wouldn't be of the correct size.
 */
export const collapseAdjacentGlue = <T extends TextItem | DOMItem>(items: T[]): T[] => {
  let output: T[] = [];
  items.forEach((item) => {
    if (item.type === 'glue' && output.at(-1)?.type === 'glue') {
      const lastItem = output.at(-1)! as Glue;
      lastItem.width = Math.max(item.width, lastItem.width);
      lastItem.stretch = Math.max(item.stretch, lastItem.stretch);
      lastItem.shrink = Math.max(item.shrink, lastItem.shrink);
      if ('text' in item) {
        (output.at(-1) as TextGlue).text += item.text;
      }
      if ('endOffset' in item) {
        (output.at(-1) as DOMGlue).endContainer = item.endContainer;
        (output.at(-1) as DOMGlue).endOffset = item.endOffset;
      }
    } else {
      output.push(item);
    }
  });
  return output;
};

export const forciblySplitLongWords = (
  items: TextItem[],
  options: TexLinebreakOptions,
): TextItem[] => {
  let output: TextItem[] = [];
  const minLineWidth = getMinLineWidth(options.lineWidth);
  items.forEach((item) => {
    if (item.type === 'box' /*&& item.width > minLineWidth*/) {
      for (let i = 0; i < item.text.length; i++) {
        const char = item.text[i];
        /** Add penalty */
        // Separators
        if (/\p{General_Category=Z}/u.test(char)) {
          output.push(penalty(0, 0));
        }
        // Punctuation
        else if (/\p{General_Category=P}/u.test(char)) {
          output.push(penalty(0, 0));
        } else {
          output.push(penalty(0, 999));
        }
        /** Add glue */
        output.push(textBox(char, options));
      }
    } else {
      output.push(item);
    }
  });
  return output;
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
  /** A glue cannot be followed by a non-MIN_COST penalty */
  if (
    items.some(
      (item, index) =>
        item.type === 'glue' &&
        items[index + 1].type === 'penalty' &&
        (items[index + 1] as Penalty).cost! > MIN_COST,
    )
  ) {
    throw new Error(
      "A glue cannot be followed by a penalty with a cost greater than MIN_COST. If you're trying to penalize a glue, make the penalty come before it.",
    );
  }
};

// +  /** Get the nearest previous item that matches a predicate. */
// +  getPrevMatching(
// +    callbackFn: (item: Item) => boolean,
// +    options: { minIndex?: number },
// +  ): Item | undefined {
// +    for (let j = this.index - 1; j >= (options.minIndex || 0); j--) {
// +      const item = this.parentArray[j];
// +      if (callbackFn(item)) return item;
// +    }
// +    return undefined;
// +  }
//
// +  /** Get the next item that matches a predicate. */
// +  getNextMatching(
// +    callbackFn: (item: Item) => boolean,
// +    options: { maxIndex?: number },
// +  ): Item | undefined {
// +    for (let j = this.index + 1; j <= (options.maxIndex || this.parentArray.length); j++) {
// +      const item = this.parentArray[j];
// +      if (callbackFn(item)) return item;
// +    }
// +    return undefined;
//    }
//  }
