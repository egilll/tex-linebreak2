import { Glue, Item, MAX_COST, Penalty } from "src/breakLines";
import { DOMGlue, DOMItem } from "src/html/getItemsFromDOM";
import { TextItem } from "src/utils/items";
import { isNonForcedBreak } from "src/utils/utils";

export function collapseNegativeWidths() {}

/**
 * We cannot actually merge adjacent glue into one since sometimes
 * the user has to depend on the output being the same as the input.
 * This especially applies to DOM, where our DOM ranges have to
 * match up with characters and cannot span nested elements.
 *
 * The HTML "text <!-- comment node --> text" becomes ["text", " ",
 * " ", "text"], and here we make the second space a zero width one.
 */
export function collapseAdjacentDOMWhitespace(items: TextItem[]) {
  for (let i = 0; i < items.length; i++) {
    if (
      items[i].type === "glue" &&
      items[i].width > 0 &&
      items[i - 1]?.type !== "glue" &&
      items[i + 1]?.type === "glue" &&
      "text" in items[i]
    ) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].type === "glue") {
          // todo: reconsider?
          if ("text" in items[j]) {
            makeZeroWidth(items[j] as Glue);
          }
        } else {
          i = j;
          break;
        }
      }
    }
  }
}

// export function makeGlueAtEndsZeroWidth(
//   items: Item[],
//   startIndex: number = 0,
//   markAsSkipped = false
// ) {
//   makeGlueAtBeginningZeroWidth(items, startIndex, markAsSkipped);
//   makeGlueAtEndZeroWidth(items, undefined, markAsSkipped);
// }

export function makeGlueAtBeginningZeroWidth(
  items: Item[],
  startIndex: number = 0,
  markAsSkipped = false
) {
  for (let i = startIndex; i < items.length; i++) {
    if (items[i].type === "glue") {
      makeZeroWidth(items[i] as Glue, markAsSkipped);
    } else if (!(isFakeBox(items[i]) || isNonForcedBreak(items[i]))) {
      break;
    } else if (isNonForcedBreak(items[i])) {
      /** Note: Needed for left aligned text preceded by newlines. */
      (items[i] as Penalty).cost = MAX_COST;
    }
  }
}

export function makeGlueAtEndZeroWidth(
  items: Item[],
  startIndex?: number,
  markAsSkipped = false
) {
  for (let i = (startIndex ?? items.length) - 1; i > 0; i--) {
    if (items[i].type === "glue") {
      makeZeroWidth(items[i] as Glue, markAsSkipped);
    } else if (!(isFakeBox(items[i]) || isNonForcedBreak(items[i]))) {
      break;
    } else if (isNonForcedBreak(items[i])) {
      (items[i] as Penalty).cost = MAX_COST;
    }
  }
}

export function isFakeBox(item: Item) {
  return (
    item && "skipWhenRendering" in item && (item as DOMItem).skipWhenRendering
  );
}

export function makeZeroWidth(item: Glue, markAsSkipped = false) {
  item.width = 0;
  item.stretch = 0;
  item.shrink = 0;
  if (markAsSkipped) {
    (item as DOMGlue).skipWhenRendering = true;
  }
  return item;
}
