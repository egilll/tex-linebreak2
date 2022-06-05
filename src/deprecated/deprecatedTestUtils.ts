import { TextItem } from 'src/utils/utils';

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

/** @deprecated */
export function lineStrings(items: TextItem[], breakpoints: number[]): string[] {
  const pieces = items.map(itemToString);
  const start = (pos: number) => (pos === 0 ? 0 : pos + 1);
  return chunk(breakpoints, 2).map(([a, b]) =>
    pieces
      .slice(start(a), b + 1)
      /**
       * TODO: Not good enough, the !== '-' removes
       * standalone hyphens in the middle of strings
       */
      .filter((w, i, ary) => w !== '-' || i === ary.length - 1)
      .join('')
      .trim(),
  );
}
