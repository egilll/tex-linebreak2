import { TexLinebreakOptions } from "src/options";
import { box, glue, penalty, TextItem } from "src/utils/items";
import {
  isBreakablePenalty,
  isForcedBreak,
  isNonBreakablePenalty,
  isSoftHyphen,
} from "src/utils/utils";

/**
 * Here we calculate the width of the hanging punctuation of this item,
 * which will be used if the item is at the beginning or end of a line.
 */
export const addHangingPunctuation = (
  items: TextItem[],
  options: TexLinebreakOptions
): TextItem[] => {
  let output: TextItem[] = [];
  /** If we have to skip over an item */
  let ignoredItems: Set<TextItem> = new Set();
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const prevItem = items[i - 1];
    const nextItem = items[i + 1];

    if (item.type !== "box" || !("text" in item) || item.width === 0) {
      if (!ignoredItems.has(item)) {
        output.push(item);
      }
      continue;
    }

    /** Left hanging punctuation */
    if (
      item.text &&
      // Check that this doesn't come directly after a non-breakable item
      (isBreakablePenalty(prevItem) ||
        !prevItem ||
        (prevItem.type === "glue" && !isNonBreakablePenalty(items[i - 2]))) &&
      hangingPunctuationRegex.test(item.text.slice(0, 1)) &&
      // If the character is repeated ("...", "??"), we don't hang
      item.text.slice(0, 1) !== item.text.slice(1, 2)
    ) {
      const leftHangingPunctuationWidth =
        item.width - options.measureFn(item.text.slice(1));

      output.push(glue(leftHangingPunctuationWidth, 0, 0));
      output.push(box(-leftHangingPunctuationWidth));
    }

    output.push(item);

    /**
     * Right hanging punctuation.
     *
     * The paper recommends using another method (making the box's width
     * smaller and moving that width to the adjacent glue), however that
     * does not work with HTML, as there we have to rely on the boxes
     * actually being their given width, unless we use absolute positioning.
     */
    if (
      item.text &&
      // Must not be followed by another box
      (isBreakablePenalty(nextItem) || nextItem?.type === "glue") &&
      !isSoftHyphen(nextItem) &&
      !isForcedBreak(nextItem) &&
      hangingPunctuationRegex.test(item.text.slice(-1)) &&
      item.text.slice(-1) !== item.text.slice(-2, -1)
    ) {
      const rightHangingPunctuationWidth =
        item.width - options.measureFn(item.text.slice(0, -1));

      /**
       * Special handling of penalties that come directly after boxes.
       * In that case, we have to add the glue to AFTER the penalty.
       */
      if (nextItem.type === "penalty") {
        output.push(nextItem);
        ignoredItems.add(nextItem);
      }
      output.push(box(-rightHangingPunctuationWidth));
      output.push(glue(rightHangingPunctuationWidth, 0, 0));
    }
  }

  return output;
};

/**
 * The following punctuation items are not included, as it would not look good:
 *
 * - Slashes (/)
 * - Em and en dashes
 *
 * (`General_Category=Pi` are initial quotes, and `General_Category=Pf` are
 * final quotes)
 */
const hangingPunctuationRegex =
  /[.,;:!?\-()\[\]{}'"\p{General_Category=Pi}\p{General_Category=Pf}]/u;
