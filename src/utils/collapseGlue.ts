import { Glue, Item } from "src/breakLines";
import { TextItem } from "src/utils/items";

/**
 * We cannot actually merge adjacent glue into one since sometimes
 * the user has to depend on the output being the same as the input.
 * This especially applies to DOM, where our DOM ranges have to
 * match up with characters and cannot span nested elements.
 *
 * The HTML "text <!-- comment node --> text" becomes ["text", " ",
 * " ", "text"], and here we make the second space a zero width one.
 */
export const collapseAdjacentTextGlueWidths = (items: TextItem[]) => {
  for (let i = 0; i < items.length; i++) {
    if (
      items[i].type === "glue" &&
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
};

export const makeGlueAtEndsZeroWidth = (
  items: Item[],
  startIndex: number = 0,
  markAsSkipped = false
) => {
  makeGlueAtBeginningZeroWidth(items, startIndex, markAsSkipped);
  makeGlueAtEndZeroWidth(items, markAsSkipped);
};

export const makeGlueAtBeginningZeroWidth = (
  items: Item[],
  startIndex: number = 0,
  markAsSkipped = false
) => {
  for (let i = startIndex; i < items.length; i++) {
    if (items[i].type === "glue") {
      makeZeroWidth(items[i] as Glue, markAsSkipped);
    } else {
      break;
    }
  }
};

export const makeGlueAtEndZeroWidth = (
  items: Item[],
  markAsSkipped = false
) => {
  for (let i = items.length - 1; i > 0; i--) {
    if (items[i].type === "glue") {
      makeZeroWidth(items[i] as Glue, markAsSkipped);
    } else {
      break;
    }
  }
};

export const makeZeroWidth = (item: Glue, markAsSkipped = false) => {
  item.width = 0;
  item.stretch = 0;
  item.shrink = 0;
  if (markAsSkipped) {
    item.skipWhenRendering = true;
  }
};
