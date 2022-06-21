import DOMTextMeasurer from "src/html/DOMTextMeasurer";
import { TemporaryControlItem } from "src/html/getItemsFromDOM/controlItems";
import { DOMItem } from "src/html/getItemsFromDOM/index";
import { tagNode } from "src/html/tagNode";
import { TexLinebreakOptions } from "src/options";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";
import { TextItem } from "src/utils/items";
import { getText, isForcedBreak } from "src/utils/utils";

export type TemporaryUnprocessedTextNode = {
  text: string;
  textNode: Text;
  element: Element;
  options: TexLinebreakOptions;
};

/**
 * Processes the temporary text nodes and wraps
 * the items in the text node in <span/> elements.
 */
export function processText(
  items: (DOMItem | TemporaryUnprocessedTextNode | TemporaryControlItem)[],
  domTextMeasureFn: InstanceType<typeof DOMTextMeasurer>["measure"]
): (DOMItem | TemporaryControlItem)[] {
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    if (!("textNode" in item)) continue;

    const precedingText = (() => {
      const allPrecedingItems = items.slice(0, index);
      const previousParagraphBreakIndex = allPrecedingItems.findIndex(
        (_item, _index) => isForcedBreak(_item as DOMItem) || _index === 0
      );
      return allPrecedingItems
        .slice(previousParagraphBreakIndex)
        .map(getText)
        .join("");
    })();

    const followingText = (() => {
      const allFollowingItems = items.slice(index);
      const nextParagraphBreakIndex = allFollowingItems.findIndex(
        (_item, _index) =>
          isForcedBreak(_item as DOMItem) ||
          _index === allFollowingItems.length - 1
      );
      return allFollowingItems
        .slice(nextParagraphBreakIndex)
        .map(getText)
        .join("");
    })();

    const textItems = splitTextIntoItems(
      item.text,
      {
        ...item.options,
        measureFn: (word) => domTextMeasureFn(word, item.element, item.options),
        addParagraphEnd: false,
      },
      precedingText,
      followingText
    );

    let _items: DOMItem[] = [];
    let replacementFragment = document.createDocumentFragment();
    textItems.forEach((item: TextItem) => {
      let span: HTMLElement | undefined;

      if (item.type === "glue" || item.type === "box") {
        span = tagNode(document.createElement("span"));
        span.appendChild(document.createTextNode(getText(item)));
      }

      _items.push({ ...item, span });

      if (span) {
        replacementFragment.appendChild(span);
      }
    });

    /** Overwrite the temporary text node item in the items array */
    items.splice(index, 1, ..._items);

    item.textNode.parentNode!.replaceChild(replacementFragment, item.textNode);
  }
  return items as (DOMItem | TemporaryControlItem)[];
}
