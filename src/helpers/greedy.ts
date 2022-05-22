import { MIN_COST } from 'src/layout';

/**
 * This utility function does not use TeX's line breaking algorithm,
 * but it is included here for the convenience users who may wish
 * to utilize the same chunking function to greedily break lines.
 */
export function greedyLineWrap(paragraphs: ParagraphWithWidth[], options: AllOptions): string[] {
  const paragraphsSplitIntoItems = splitParagraphsIntoItems(paragraphs, options);

  return paragraphsSplitIntoItems.map((items, paragraphIndex) => {
    let lines: string[] = [''];
    const maxWidth = paragraphs[paragraphIndex].printWidth;

    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex];
      if (item.type === 'penalty' && item.cost <= MIN_COST) {
        lines.push('');
      } else if (item.type === 'box') {
        const nextBreakingSpot =
          items.slice(itemIndex).findIndex((j) => j.type === 'glue', itemIndex) + itemIndex;
        const toAdd = items.slice(itemIndex, nextBreakingSpot);
        if (lines[lines.length - 1].length + item.width > maxWidth) {
          lines.push('');
        }
        lines[lines.length - 1] += toAdd.map((j) => j.text).join('');
      } else if (item.type === 'glue') {
        lines[lines.length - 1] += item.text || '';
      }
    }
    return lines
      .map((k) => k.trim())
      .filter(Boolean)
      .join('\n');
  });
}