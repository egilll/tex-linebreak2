import { Box, Glue, Penalty, MIN_COST, InputItem, MAX_COST } from 'src/breakLines';

/**
 * Useful when working with raw strings instead of DOM nodes.
 */
export interface TextBox extends Box {
  text: string;
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

export function penalty(width: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width, cost, flagged };
}

export function forcedBreak(): Penalty {
  return { type: 'penalty', cost: MIN_COST, width: 0, flagged: false };
}

export function paragraphEnd(): [TextGlue, Penalty] {
  return [
    /** Glue that can fill the entire line. */
    {
      type: 'glue',
      width: 0,
      shrink: 0,
      stretch: MAX_COST,
      text: '',
    },
    forcedBreak(),
  ];
}

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

export const collapseAdjacentSpaces = <T extends InputItem>(items: T[]): T[] => {
  throw new Error('Not implemented');
};
