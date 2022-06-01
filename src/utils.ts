import { Box, Glue, Item, MAX_COST, MIN_COST, Penalty } from 'src/breakLines/breakLines';
import { DOMGlue, DOMItem } from 'src/html/getItemsFromDOM';
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
  throw new Error('Not implemented');
  // const spaceWidth = options.measureFn(' ');
  // const spaceShrink = spaceWidth * options.glueShrinkFactor;
  // const spaceStretch = spaceWidth * options.glueStretchFactor;
  // if (options.justify) {
  //   /** Spaces in justified lines */
  //   return glue(spaceWidth, spaceShrink, spaceStretch, text);
  // } else {
  //   /**
  //    * Spaces in ragged lines. See p. 1139.
  //    * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
  //    * (Todo: Ragged line spaces should perhaps be allowed to stretch
  //    * a bit, but it should probably still be listed as zero here since
  //    * otherwise a line with many spaces is more likely to be a good fit.)
  //    */
  //   const lineFinalStretch = 3 * spaceWidth;
  //   return [
  //     glue(0, 0, lineFinalStretch, text),
  //     penalty(0, 0),
  //     glue(spaceWidth, 0, -lineFinalStretch, text),
  //   ];
  // }
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
