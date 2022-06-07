import { Glue, Item } from "src/breakLines";

/**
 * We cannot actually merge adjacent glue into one since sometimes
 * the user has to depend on the output being the same as the input.
 * This especially applies to DOM, where our DOM ranges have to match
 * up with characters and cannot span nested elements, for example.
 *
 * The HTML "text <!-- comment node --> text" becomes ["text", " ", "
 * ", "text"], and here we make the second space a zero width one.
 */
export const collapseAdjacentGlueWidths = (items: Item[]) => {
  for (let i = 0; i < items.length; i++) {
    if (
      items[i].type === "glue" &&
      items[i - 1]?.type !== "glue" &&
      items[i + 1]?.type === "glue"
    ) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[j].type === "glue") {
          // todo: reconsider
          if ("text" in items[i] && "text" in items[j]) {
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

export const makeZeroWidth = (item: Glue) => {
  item.width = 0;
  item.stretch = 0;
  item.shrink = 0;
};

export const makeGlueAtEndsZeroWidth = (
  items: Item[],
  startIndex: number = 0
) => {
  makeGlueAtBeginningZeroWidth(items, startIndex);
  makeGlueAtEndZeroWidth(items);
};

export const makeGlueAtBeginningZeroWidth = (
  items: Item[],
  startIndex: number = 0
) => {
  for (let i = startIndex; i < items.length; i++) {
    if (items[i].type === "glue") {
      makeZeroWidth(items[i] as Glue);
    } else {
      break;
    }
  }
};

export const makeGlueAtEndZeroWidth = (items: Item[]) => {
  for (let i = items.length - 1; i > 0; i--) {
    if (items[i].type === "glue") {
      makeZeroWidth(items[i] as Glue);
    } else {
      break;
    }
  }
};
