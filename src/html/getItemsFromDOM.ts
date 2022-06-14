import { Box, Glue, INFINITE_STRETCH, Penalty } from "src/breakLines";
import DOMTextMeasurer from "src/html/domTextMeasurer";
import { tagNode } from "src/html/tagNode";
import { TexLinebreakOptions } from "src/options";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";
import {
  collapseAdjacentTextGlueWidths,
  makeGlueAtBeginningZeroWidth,
  makeGlueAtEndZeroWidth,
} from "src/utils/collapseGlue";
import {
  box,
  forcedBreak,
  glue,
  paragraphEnd,
  TextBox,
  TextGlue,
  TextItem,
} from "src/utils/items";
import { getText, isForcedBreak, makeNonBreaking } from "src/utils/utils";

export interface DOMInfo {
  span?: HTMLElement;
  /**
   * For boxes:
   * Marks a box as being ignored for xOffset width calculations,
   * such as when the styling is already included in th element.
   *
   * For glue:
   * Used to not add unnecessary spans when the whitespace will
   * be collapsed anyways
   *
   * For penalty:
   * Used to skip adding a <br/> when one already exists
   */
  skipWhenRendering?: boolean;
}

export type DOMBox = (Box | TextBox) & DOMInfo;
export type DOMGlue = (Glue | TextGlue) & DOMInfo;
export type DOMPenalty = Penalty & DOMInfo;
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

type TemporaryUnprocessedTextNode = {
  text: string;
  textNode: Text;
  element: Element;
};
type ControlItem =
  | "IGNORE_WHITESPACE_AFTER"
  | "IGNORE_WHITESPACE_BEFORE"
  | "START_NON_BREAKING_RANGE"
  | "END_NON_BREAKING_RANGE";

export class DomItemHelper extends Array<
  DOMItem | TemporaryUnprocessedTextNode | ControlItem
> {}

/**
 * This function is fairly confusing, but the reason is that:
 *
 * 1. in order to correctly split text we have to know what the surrounding
 *    text is, and
 * 2. we need to collapse whitespace in the same manner as HTML documents do.
 *
 * We start by finding all elements and building a temporary list of items
 * in which the text has not been processed into items.
 *
 * We then split the text into items, knowing what text surrounds it.
 *
 * Then we wrap each item in the text node in <span/> elements. This
 * is done since it saves us from having to walk the tree again when we
 * finally render the output.
 */
export class GetItemsFromDOMAndWrapInSpans {
  items = new DomItemHelper();

  constructor(
    public paragraphElement: HTMLElement,
    public options: TexLinebreakOptions,
    public domTextMeasureFn: InstanceType<typeof DOMTextMeasurer>["measure"]
  ) {
    this.items.push("IGNORE_WHITESPACE_AFTER");
    this.getItemsFromNode(this.paragraphElement);
    this.items.push("IGNORE_WHITESPACE_BEFORE");

    this.processText();
    this.processControlItems();
    collapseAdjacentTextGlueWidths(this.items);
  }

  processControlItems() {
    this.ignoreWhitespaceComingAfter.forEach((oldIndex) => {
      makeGlueAtBeginningZeroWidth(
        items,
        oldToNewIndexMap.get(oldIndex)!,
        true
      );
    });
    this.ignoreWhitespaceComingBefore.forEach((oldIndex) => {
      makeGlueAtEndZeroWidth(items, oldToNewIndexMap.get(oldIndex)!, true);
    });
    if (false) {
      this.nonBreakingRanges.forEach((oldStartIndex, oldEndIndex) => {
        makeNonBreaking(
          items,
          oldToNewIndexMap.get(oldStartIndex)!,
          oldToNewIndexMap.get(oldEndIndex)!
        );
      });
    }
    this.items = items;
  }

  getItemsFromNode(node: Node, addParagraphEnd = true) {
    Array.from(node.childNodes).forEach((child) => {
      if (child instanceof Text) {
        this.items.push({
          text: child.nodeValue || "",
          textNode: child,
          element: node as Element,
        });
      } else if (child instanceof Element) {
        this.getItemsFromElement(child);
      }
    });

    if (addParagraphEnd) {
      this.items.push("IGNORE_WHITESPACE_BEFORE");
      this.items.push(...paragraphEnd(this.options));
    }
  }

  getItemsFromElement(element: Element) {
    const {
      display,
      position,
      width,
      paddingLeft,
      paddingRight,
      marginLeft,
      marginRight,
      borderLeftWidth,
      borderRightWidth,
    } = getComputedStyle(element);

    if (display === "none" || position === "absolute") {
      return;
    }

    /** <br/> elements */
    if (element.tagName === "BR") {
      this.ignoreWhitespaceComingBefore.add(this.items.length);
      if (this.options.addInfiniteGlueToFinalLine) {
        this.items.push(glue(0, INFINITE_STRETCH, 0));
      }
      this.items.push({
        ...forcedBreak(),
        skipWhenRendering: true,
      });
      this.ignoreWhitespaceComingAfter.add(this.items.length);
      return;
    }

    if (display === "inline" || display === "inline-block") {
      // Add box for margin/border/padding at start of box.
      const leftMargin =
        parseFloat(marginLeft!) +
        parseFloat(borderLeftWidth!) +
        parseFloat(paddingLeft!);
      if (leftMargin) {
        this.items.push({
          ...box(leftMargin),
          skipWhenRendering: true,
        });
      }

      if (display === "inline-block") {
        this.items.push("START_NON_BREAKING_RANGE");
        this.items.push("IGNORE_WHITESPACE_AFTER");
        this.getItemsFromNode(element, false);
        this.items.push("IGNORE_WHITESPACE_BEFORE");
        this.items.push("END_NON_BREAKING_RANGE");

        // (element as HTMLElement).classList.add(
        //   "texLinebreakNearestBlockElement"
        // );
      } else {
        this.getItemsFromNode(element, false);
      }

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) +
        parseFloat(borderRightWidth!) +
        parseFloat(paddingRight!);
      if (rightMargin) {
        this.items.push({
          ...box(rightMargin),
          skipWhenRendering: true,
        });
      }
    } else {
      let _width = parseFloat(width);
      if (isNaN(_width)) {
        console.error(
          "Received an element with an unparsable width. This should have been handled.",
          element
        );
        _width = 0;
      }

      // Treat this item as an opaque box.
      this.items.push(box(_width));
    }
  }

  /**
   * Processes all text in `itemsWithUnprocessedText` and
   * wraps the items in the text node in <span/> elements.
   */
  processText() {
    let items: DOMItem[] = [];

    const oldToNewIndexMap = new Map<number, number>();

    for (let index = 0; index < this.items.length; index++) {
      oldToNewIndexMap.set(index, items.length);
      const item = this.items[index];
      if (!("textNode" in item)) {
        items.push(item);
      } else {
        const precedingText = (() => {
          const allPrecedingItems = this.items.slice(0, index);
          const previousParagraphBreakIndex = allPrecedingItems.findIndex(
            (_item, _index) => isForcedBreak(_item as DOMItem) || _index === 0
          );
          return allPrecedingItems
            .slice(previousParagraphBreakIndex)
            .map(getText)
            .join("");
        })();

        const followingText = (() => {
          const allFollowingItems = this.items.slice(index);
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

        console.log({ text: item.text, textItems });

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

        item.textNode.parentNode!.replaceChild(
          replacementFragment,
          item.textNode
        );
      }
      oldToNewIndexMap.set(index + 1, items.length);
    }
  }
}
