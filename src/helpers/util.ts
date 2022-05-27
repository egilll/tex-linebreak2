import { Box, Glue, Penalty, MIN_COST, InputItem, MAX_COST } from 'src/breakLines';
import { PenaltyClasses } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';
import { HelperOptions } from 'src/helpers/options';

/**
 * Useful when working with raw strings instead of DOM nodes.
 */
export interface TextBox extends Box {
  text: string;

  /** Values for hanging punctuation. */
  rightHangingPunctuationWidth?: number;
  leftHangingPunctuationWidth?: number;
}

export interface TextGlue extends Glue {
  text: string;
}

export type TextInputItem = TextBox | TextGlue | Penalty;

export function box(width: number): Box;
export function box(width: number, text: string): TextBox;
export function box(width: number, text?: string): Box | TextBox {
  return { type: 'box', width, text };
}
export function textBox(text: string, options: HelperOptions): TextBox {
  return box(options.measureFn!(text), text);
}

export function glue(width: number, shrink: number, stretch: number): Glue;
export function glue(width: number, shrink: number, stretch: number, text: string): TextGlue;
export function glue(
  width: number,
  shrink: number,
  stretch: number,
  text?: string,
): Glue | TextGlue {
  return { type: 'glue', width, shrink, stretch, text };
}
export function textGlue(text: string, options: HelperOptions): TextGlue {
  const spaceWidth = options.measureFn!(' ');
  const spaceShrink = 0;
  const spaceStretch = spaceWidth * 2;
  return glue(spaceWidth, spaceShrink, spaceStretch, text);
}

export function penalty(width: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width, cost, flagged };
}

export const softHyphen = (options: HelperOptions) => {
  const hyphenWidth = options.hangingPunctuation ? 0 : options.measureFn!('-');
  return penalty(hyphenWidth, options.softHyphenationPenalty ?? PenaltyClasses.SoftHyphen, true);
  // return penalty(options.measureFn!('-'), PenaltyClasses.SoftHyphen, true);
};

/** Todo: Should regular hyphens not be flagged? */
export const isSoftHyphen = (item: InputItem | undefined): boolean => {
  if (!item) return false;
  return Boolean(item.type === 'penalty' && item.flagged /*&& item.width > 0*/);
};

export function forcedBreak(): Penalty {
  return penalty(0, MIN_COST);
}

// export function paragraphEnd(): [TextGlue, Penalty] {
//   return [
//     /** Glue that can fill the entire line. */
//     {
//       type: 'glue',
//       width: 0,
//       shrink: 0,
//       stretch: MAX_COST,
//       text: '',
//     },
//     forcedBreak(),
//   ];
// }

/**
 * Retrieves the text from an input item.
 * Text is included in {@link TextInputItem}s by {@link splitTextIntoItems}.
 */
export function itemToString(item: TextInputItem) {
  switch (item.type) {
    case 'box':
      return item.text;
    case 'glue':
      return ' '; // TODO: check
    case 'penalty':
      return item.flagged ? '-' : ''; // TODO: See comment in {@link lineStrings}
  }
}

export function lineStrings(items: TextInputItem[], breakpoints: number[]): string[] {
  const pieces = items.map(itemToString);
  const start = (pos: number) => (pos === 0 ? 0 : pos + 1);
  return chunk(breakpoints, 2).map(([a, b]) =>
    pieces
      .slice(start(a), b + 1)
      /**
       * TODO: Not good enough, the !== '-' removes standalone hyphens in the middle of strings
       */
      .filter((w, i, ary) => w !== '-' || i === ary.length - 1)
      .join('')
      .trim(),
  );
}

export function chunk<T>(breakpoints: T[], width: number) {
  let chunks: T[][] = [];
  for (let i = 0; i <= breakpoints.length - width; i++) {
    chunks.push(breakpoints.slice(i, i + width));
  }
  return chunks;
}

/**
 * Used to prevent the last line from having a hanging last line.
 * Note: This results in the paragraph not filling the entire allowed width,
 * but the output will have all lines balanced.
 */
export const removeGlueFromEndOfParagraphs = <T extends InputItem>(items: T[]): T[] => {
  return items.slice().filter((item) => !(item.type === 'glue' && item.stretch === MAX_COST));
};

export const collapseAdjacentGlue = (items: TextInputItem[]): TextInputItem[] => {
  let output: TextInputItem[] = [];
  items.forEach((item) => {
    if (item.type === 'glue') {
      if (output.length > 0 && output[output.length - 1].type === 'glue') {
        output[output.length - 1].width += item.width;
        (output[output.length - 1] as TextGlue).text += item.text;
      } else {
        output.push(item);
      }
    } else {
      output.push(item);
    }
  });
  return output;
};
