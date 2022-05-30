import { TextItem, itemToString } from 'src/helpers/util';

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

export function chunk<T>(breakpoints: T[], width: number) {
  let chunks: T[][] = [];
  for (let i = 0; i <= breakpoints.length - width; i++) {
    chunks.push(breakpoints.slice(i, i + width));
  }
  return chunks;
}
