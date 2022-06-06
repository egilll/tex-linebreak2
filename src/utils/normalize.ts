import { Glue, INFINITE_STRETCH, Item } from "src/breakLines";
import { DOMGlue, DOMItem } from "src/html/getItemsFromDOM";
import { TextGlue, TextItem } from "src/utils/utils";

/**
 * Collapsing adjacent glue is easier on the algorithm, but is also necessary
 * in order to allow glue to stretch over multiple text nodes, for example,
 * the HTML "text <!-- comment node --> text" would otherwise become ["text",
 * " ", " ", "text"] and the glue wouldn't be of the correct size.
 *
 * p. 1146
 */
export const normalizeItems = <T extends TextItem | DOMItem | Item>(
  items: T[]
): T[] => {
  let output: T[] = [];
  items.forEach((item, index) => {
    if (item.type === "glue" && output.at(-1)?.type === "glue") {
      const prevItem = output.at(-1)! as Glue;

      // todo: check whether glue should be collapsed
      prevItem.width = item.width + prevItem.width;

      prevItem.stretch =
        item.stretch === INFINITE_STRETCH ||
        prevItem.stretch === INFINITE_STRETCH
          ? INFINITE_STRETCH
          : item.stretch + prevItem.stretch;
      prevItem.shrink = item.shrink + prevItem.shrink;

      /* Join text */
      if ("text" in item || "text" in output.at(-1)!) {
        (output.at(-1) as TextGlue).text =
          ((output.at(-1) as TextGlue).text || "") +
          ((item as TextGlue).text || "");
      }

      /* Join DOM offset information. */
      if ("endOffset" in item) {
        (output.at(-1) as DOMGlue).endContainer = item.endContainer;
        (output.at(-1) as DOMGlue).endOffset = item.endOffset;
      }
    }
    // // else /** Collapse adjacent penalties */
    // //     if (item.type === 'penalty' && output.at(-1)?.type === 'penalty') {
    // //     }
    else {
      // todo, finish
      output.push(item);
    }
  });
  return output;
};
