import { MAX_COST, MIN_COST } from 'src/breakLines/breakLines';
import { DOMGlue, DOMItem } from 'src/html/getItemsFromDOM';
import { Box, Glue, Item, Items, Penalty } from 'src/items';

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

export function penalty(width: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width, cost, flagged };
}

/** Todo: Should regular hyphens not be flagged? If so this function doesn't work */
export const isSoftHyphen = (item: Item | undefined): boolean => {
  if (!item) return false;
  return Boolean(item.type === 'penalty' && item.flagged /*&& item.width > 0*/);
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

export const forciblySplitLongWords = (items: Items) => {
  const minLineWidth = getMinLineWidth(items.options.lineWidth);
  items.forEach((item) => {
    if (item.type === 'box' && item.width > minLineWidth) {
      for (let i = 0; i < item.text.length; i++) {
        const char = item.text[i];
        throw new Error('Not implemented');
        // todo: ekki rétt gert hjá mér að replace-a svona
        // /** Add penalty */
        // // Separators
        // if (/\p{General_Category=Z}/u.test(char)) {
        //   items.add(penalty(0, 0));
        // }
        // // Punctuation
        // else if (/\p{General_Category=P}/u.test(char)) {
        //   items.add(penalty(0, 0));
        // } else {
        //   items.add(penalty(0, 999));
        // }
        // /** Add glue */
        // items.addTextBox(char, );
      }
    }
  });
};

export type LineWidth = number | number[] | LineWidthObject;
/**
 * It may be useful to only indicate certain lines as being smaller
 * than the default, since the content may be arbitrarily long.
 */
export type LineWidthObject = {
  defaultLineWidth: number;
  [lineIndex: number]: number;
};

/** Gets line width for a given line number */
export const getLineWidth = (lineWidths: LineWidth, lineIndex: number): number => {
  if (typeof lineWidths === 'number') {
    return lineWidths;
  } else if (Array.isArray(lineWidths)) {
    if (lineIndex < lineWidths.length) {
      return lineWidths[lineIndex];
    } else {
      /** If out of bounds, return the last width of the last line. */
      return lineWidths.at(-1)!;
    }
  } else {
    return lineWidths[lineIndex] || lineWidths.defaultLineWidth;
  }
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
