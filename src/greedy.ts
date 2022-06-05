import { Item, MAX_COST } from 'src/breakLines';
import { RequireOnlyCertainKeys, TexLinebreakOptions } from 'src/options';
import { getLineWidth, isForcedBreak } from 'src/utils/utils';

/**
 * This utility function does not use TeX's line breaking algorithm,
 * but it is included here for the convenience users who may wish to
 * utilize the same chunking function to greedily break lines.
 */
export function breakLinesGreedy(
  items: Item[],
  options: RequireOnlyCertainKeys<TexLinebreakOptions, 'lineWidth'>,
): number[] {
  let breakpoints: number[] = [0];
  let curLineWidth = 0;
  let bestBreakForLine: number | null = null;

  function addBreak(index: number) {
    breakpoints.push(index);
    curLineWidth = 0;
    bestBreakForLine = null;
  }

  items.forEach((item, index) => {
    const idealLen = getLineWidth(options.lineWidth, breakpoints.length + 1);

    if (isForcedBreak(item)) {
      return addBreak(index);
    } else if (item.type === 'box') {
      curLineWidth += item.width;
      if (curLineWidth > idealLen && bestBreakForLine) {
        addBreak(bestBreakForLine);
        curLineWidth += item.width;
      }
    } else if (item.type === 'glue' && items[index - 1].type === 'box') {
      bestBreakForLine = index;
      curLineWidth += item.width;
    } else if (item.type === 'penalty' && item.cost < MAX_COST) {
      bestBreakForLine = index;
      // Note: Currently does not take into consideration hyphen width...
    }
  });
  console.log({ breakpoints });
  return breakpoints;
}
