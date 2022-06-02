import { Item } from 'src/items';
import { LineWidth } from 'src/utils';

/**
 * This utility function does not use TeX's line breaking algorithm,
 * but it is included here for the convenience users who may wish to
 * utilize the same chunking function to greedily break lines.
 */
export function breakLinesGreedy(items: Item[], lineWidths: LineWidth): number[] {
  let breakpoints: number[] = [];

  // for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
  //   const item = items[itemIndex];
  //   if (item.type === 'penalty' && item.cost <= MIN_COST) {
  //     lines.push('');
  //   } else if (item.type === 'box') {
  //     const nextBreakingSpot =
  //       items.slice(itemIndex).findIndex((j) => j.type === 'glue', itemIndex) + itemIndex;
  //     const toAdd = items.slice(itemIndex, nextBreakingSpot);
  //     if (lines.at(-1)!.length + item.width > maxWidth) {
  //       lines.push('');
  //     }
  //     lines.at(-1) += toAdd.map((j) => j.text).join('');
  //   } else if (item.type === 'glue') {
  //     lines.at(-1) += item.text || '';
  //   }
  // }
  throw new Error('Not implemented');

  return breakpoints;
}
