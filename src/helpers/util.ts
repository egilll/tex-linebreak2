import { Box, Glue, Penalty, MIN_COST, InputItem, MAX_COST } from 'src/layout';

export function box(w: number): Box {
  return { type: 'box', width: w };
}

export function glue(w: number, shrink: number, stretch: number): Glue {
  return { type: 'glue', width: w, shrink, stretch };
}

export function penalty(w: number, cost: number, flagged: boolean = false): Penalty {
  return { type: 'penalty', width: w, cost, flagged };
}

/**
 * Return a `Penalty` item which forces a line-break.
 */
export function forcedBreak(): Penalty {
  return { type: 'penalty', cost: MIN_COST, width: 0, flagged: false };
}

export interface TextBox extends Box {
  text: string;
}

export interface TextGlue extends Glue {
  text: string;
}

export type TextInputItem = TextBox | TextGlue | Penalty;

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
