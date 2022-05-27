import { TextInputItem } from 'src/helpers/util';
import {
  breakLines,
  MaxAdjustmentExceededError,
  InputItem,
  MIN_ADJUSTMENT_RATIO,
} from 'src/breakLines';
import { layoutItemsFromString } from 'src/helpers/splitTextIntoItems';

export interface PositionedItem {
  /** Index of the item. */
  item: number;
  /** Index of the line on which the resulting item should appear. */
  line: number;
  /** X offset of the item. */
  xOffset: number;
  /**
   * Width which this item should be rendered with.
   *
   * For box and penalty items this will just be the item's width.
   * For glue items this will be the adjusted width.
   */
  width: number;
}

export interface PositionOptions {
  includeGlue?: boolean;
}

/**
 * Compute the positions at which to draw boxes forming a paragraph given a set
 * of breakpoints.
 *
 * @param items - The sequence of items that form the paragraph.
 * @param lineWidths - Length or lengths of each line.
 * @param breakpoints - Indexes within `items` of the start of each line.
 */
export function positionItems(
  items: InputItem[],
  lineWidths: number | number[],
  breakpoints: number[],
  options: PositionOptions = {},
): PositionedItem[] {
  const adjRatios = adjustmentRatios(items, lineWidths, breakpoints);
  const result: PositionedItem[] = [];

  for (let b = 0; b < breakpoints.length - 1; b++) {
    // Limit the amount of shrinking of lines to 1x `glue.shrink` for each glue
    // item in a line.
    const adjustmentRatio = Math.max(adjRatios[b], MIN_ADJUSTMENT_RATIO);
    let xOffset = 0;
    const start = b === 0 ? breakpoints[b] : breakpoints[b] + 1;

    for (let p = start; p <= breakpoints[b + 1]; p++) {
      const item = items[p];
      if (item.type === 'box') {
        result.push({
          item: p,
          line: b,
          xOffset,
          width: item.width,
        });
        xOffset += item.width;
      } else if (item.type === 'glue' && p !== start && p !== breakpoints[b + 1]) {
        let gap;
        if (adjustmentRatio < 0) {
          gap = item.width + adjustmentRatio * item.shrink;
        } else {
          gap = item.width + adjustmentRatio * item.stretch;
        }
        if (options.includeGlue) {
          result.push({
            item: p,
            line: b,
            xOffset,
            width: gap,
          });
        }
        xOffset += gap;
      } else if (item.type === 'penalty' && p === breakpoints[b + 1] && item.width > 0) {
        result.push({
          item: p,
          line: b,
          xOffset,
          width: item.width,
        });
      }
    }
  }

  return result;
}

/**
 * Helper for laying out a paragraph of text and getting the absolute xOffset
 * positions of each text chunk.
 * Can be used for rendering justified text into a
 * variety of targets (HTML, canvas, SVG, WebGL etc.)
 *
 * @param text - The text to lay out
 * @param lineWidth - Width for each line
 * @param measure - Function which is called to measure each word or space in the input
 * @param hyphenate - Function which is called to split words at possible
 * hyphenation points
 */
export function positionText(
  text: string,
  lineWidth: number | number[],
  measure: (word: string) => number,
  hyphenate: (word: string) => string[],
) {
  let items: TextInputItem[];
  let breakpoints;
  let positions: PositionedItem[];

  try {
    items = layoutItemsFromString(text, measure);
    breakpoints = breakLines(items, lineWidth, {
      maxAdjustmentRatio: 1,
    });
    positions = positionItems(items, lineWidth, breakpoints);
  } catch (e) {
    if (e instanceof MaxAdjustmentExceededError) {
      items = layoutItemsFromString(text, measure, hyphenate);
      breakpoints = breakLines(items, lineWidth);
      positions = positionItems(items, lineWidth, breakpoints);
    } else {
      throw e;
    }
  }

  return { items, breakpoints, positions };
}

/** @deprecated due to the name being unclear */
export const layoutText = positionText;
// export const layoutText = () => {};

/**
 * Compute adjustment ratios for lines given a set of breakpoints.
 *
 * The adjustment ratio of a line is the proportion of each glue item's stretch
 * (if positive) or shrink (if negative) which needs to be used in order to make
 * the line the specified width. A value of zero indicates that every glue item
 * is exactly its preferred width.
 *
 * @param items - The box, glue and penalty items being laid out
 * @param lineWidths - Length or lengths of each line
 * @param breakpoints - Indexes in `items` where lines are being broken
 *
 * @deprecated
 */
export function adjustmentRatios(
  items: InputItem[],
  lineWidths: number | number[],
  breakpoints: number[],
) {
  const lineLen = (i: number) => (Array.isArray(lineWidths) ? lineWidths[i] : lineWidths);
  const ratios = [];

  for (let b = 0; b < breakpoints.length - 1; b++) {
    let idealWidth = lineLen(b);
    let actualWidth = 0;
    let lineShrink = 0;
    let lineStretch = 0;

    const start = b === 0 ? breakpoints[b] : breakpoints[b] + 1;
    for (let p = start; p <= breakpoints[b + 1]; p++) {
      const item = items[p];
      if (item.type === 'box') {
        actualWidth += item.width;
      } else if (item.type === 'glue' && p !== start && p !== breakpoints[b + 1]) {
        actualWidth += item.width;
        lineShrink += item.shrink;
        lineStretch += item.stretch;
      } else if (item.type === 'penalty' && p === breakpoints[b + 1]) {
        actualWidth += item.width;
      }
    }

    let adjustmentRatio;
    if (actualWidth < idealWidth) {
      adjustmentRatio = (idealWidth - actualWidth) / lineStretch;
    } else {
      adjustmentRatio = (idealWidth - actualWidth) / lineShrink;
    }

    ratios.push(adjustmentRatio);
  }

  return ratios;
}
