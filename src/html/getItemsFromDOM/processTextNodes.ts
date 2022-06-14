import { DOMItem } from "src/html/getItemsFromDOM/index";
import { tagNode } from "src/html/tagNode";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";
import { TextItem } from "src/utils/items";
import { getText, isForcedBreak } from "src/utils/utils";

export type TemporaryUnprocessedTextNode = {
  text: string;
  textNode: Text;
  element: Element;
};

/**
 * Processes the temporary text nodes and wraps
 * the items in the text node in <span/> elements.
 */
export function processText() {
  for (let index = 0; index < this.temporaryItems.length; index++) {
    const item = this.temporaryItems[index];
    if (!(typeof item === "object" && "textNode" in item)) continue;

    const precedingText = (() => {
      const allPrecedingItems = this.temporaryItems.slice(0, index);
      const previousParagraphBreakIndex = allPrecedingItems.findIndex(
        (_item, _index) => isForcedBreak(_item as DOMItem) || _index === 0
      );
      return allPrecedingItems
        .slice(previousParagraphBreakIndex)
        .map(getText)
        .join("");
    })();

    const followingText = (() => {
      const allFollowingItems = this.temporaryItems.slice(index);
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
        ...this.options,
        measureFn: (word) =>
          this.domTextMeasureFn(word, item.element, this.options),
        addParagraphEnd: false,
        collapseAllNewlines: true,
      },
      precedingText,
      followingText
    );

    let items: DOMItem[] = [];
    let replacementFragment = document.createDocumentFragment();
    textItems.forEach((item: TextItem) => {
      let span: HTMLElement | undefined;

      if (item.type === "glue" || item.type === "box") {
        span = tagNode(document.createElement("span"));
        span.textContent = getText(item);
      }

      items.push({ ...item, span });

      if (span) {
        replacementFragment.appendChild(span);
      }
    });

    /** Overwrite the temporary text node item in the items array */
    this.temporaryItems.splice(index, 1, ...items);

    item.textNode.parentNode!.replaceChild(replacementFragment, item.textNode);
  }
}
