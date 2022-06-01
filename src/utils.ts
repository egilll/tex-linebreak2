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
export function textGlue(text: string, options: TexLinebreakOptions): TextGlue {
  const spaceWidth = options.measureFn(' ');
  const spaceShrink = spaceWidth + options.defaultGlueShrinkFactor;
  const spaceStretch = spaceWidth + options.defaultGlueStretchFactor;
  return glue(spaceWidth, spaceShrink, spaceStretch, text);
}

export function penalty(width: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width, cost, flagged };
}

export const softHyphen = (options: TexLinebreakOptions) => {
  const hyphenWidth = options.hangingPunctuation ? 0 : options.measureFn('-');
  return penalty(hyphenWidth, options.softHyphenPenalty ?? PenaltyClasses.SoftHyphen, true);
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
        output.push(textBox(char, options));
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
