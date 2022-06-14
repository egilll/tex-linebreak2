import { Box, Glue, INFINITE_STRETCH, Penalty } from "src/breakLines";
import DOMTextMeasurer from "src/html/domTextMeasurer";
import { tagNode } from "src/html/tagNode";
import { TexLinebreakOptions } from "src/options";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";
import {
  collapseAdjacendDOMWhitespace,
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

export type TemporaryUnprocessedTextNode = {
  text: string;
  textNode: Text;
  element: Element;
};
export type TemporaryControlItem =
  | "IGNORE_WHITESPACE_AFTER"
  | "IGNORE_WHITESPACE_BEFORE"
  | "START_NON_BREAKING_RANGE"
  | "END_NON_BREAKING_RANGE"
  | "MERGE_THIS_BOX_WITH_NEXT_BOX"
  | "MERGE_THIS_BOX_WITH_PREVIOUS_BOX";
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
  temporaryItems: (
    | DOMItem
    | TemporaryUnprocessedTextNode
    | TemporaryControlItem
  )[] = [];

  constructor(
    public paragraphElement: HTMLElement,
    public options: TexLinebreakOptions,
    public domTextMeasureFn: InstanceType<typeof DOMTextMeasurer>["measure"]
  ) {}

  getItems() {
    this.temporaryItems.push("IGNORE_WHITESPACE_AFTER");
    this.getItemsFromNode(this.paragraphElement);
    this.temporaryItems.push("IGNORE_WHITESPACE_BEFORE");

    this.processText();
    const output = this.processControlItems();
    collapseAdjacendDOMWhitespace(output);
    console.log(this.temporaryItems);
    return output;
  }

  processControlItems(): DOMItem[] {
    const temporaryItems = this.temporaryItems as (
      | DOMItem
      | TemporaryControlItem
    )[];
    const deletedItems = new Set<DOMItem>();

    for (let i = 0; i < temporaryItems.length; i++) {
      const item = temporaryItems[i];
      if (typeof item !== "string") {
        if (
          item?.type === "box" &&
          temporaryItems[i - 1] === "MERGE_THIS_BOX_WITH_NEXT_BOX"
        ) {
          const nextBox = temporaryItems
            .slice(i + 1)
            .find(
              (item) =>
                (typeof item === "object" && item.type === "box") ||
                item === "MERGE_THIS_BOX_WITH_PREVIOUS_BOX"
            );
          if (!nextBox || typeof nextBox === "string") {
            throw new Error(
              "Expected a box inside element. Empty boxes with borders or padding are not yet supported."
            );
          }
          nextBox.width += item.width;
          deletedItems.add(item);
        }

        if (
          item?.type === "box" &&
          temporaryItems[i - 1] === "MERGE_THIS_BOX_WITH_PREVIOUS_BOX"
        ) {
          const prevBox = temporaryItems
            .slice(i - 1)
            .reverse()
            .find(
              (item) =>
                (typeof item === "object" && item.type === "box") ||
                item === "MERGE_THIS_BOX_WITH_NEXT_BOX"
            );
          if (!prevBox || typeof prevBox === "string") {
            throw new Error(
              "Expected a box inside element. Empty boxes with borders or padding are not yet supported."
            );
          }
          prevBox.width += item.width;
          deletedItems.add(item);
        }
      }
    }

    const ignoreWhitespaceAfter = new Set<number>([0]);
    const ignoreWhitespaceBefore = new Set<number>();
    const nonBreakingRanges = new Map<number, number>();

    let openNonBreakingRanges: number[] = [];
    let output: DOMItem[] = [];
    temporaryItems.forEach((item) => {
      if (typeof item !== "string") {
        if (!deletedItems.has(item)) {
          output.push(item);
        }
      } else {
        switch (item) {
          case "IGNORE_WHITESPACE_AFTER":
            ignoreWhitespaceAfter.add(output.length);
            break;
          case "IGNORE_WHITESPACE_BEFORE":
            ignoreWhitespaceBefore.add(output.length);
            break;
          case "START_NON_BREAKING_RANGE":
            openNonBreakingRanges.push(output.length);
            break;
          case "END_NON_BREAKING_RANGE":
            const start = openNonBreakingRanges.pop();
            if (start !== undefined) {
              nonBreakingRanges.set(start, output.length);
            }
        }
      }
    });

    ignoreWhitespaceAfter.forEach((index) => {
      makeGlueAtBeginningZeroWidth(output, index, true);
    });
    ignoreWhitespaceBefore.forEach((index) => {
      makeGlueAtEndZeroWidth(output, index!, true);
    });
    nonBreakingRanges.forEach((startIndex, endIndex) => {
      makeNonBreaking(output, startIndex, endIndex);
    });
    return output;
  }

  getItemsFromNode(node: Node, addParagraphEnd = true) {
    Array.from(node.childNodes).forEach((child) => {
      if (child instanceof Text) {
        this.temporaryItems.push({
          text: child.nodeValue || "",
          textNode: child,
          element: node as Element,
        });
      } else if (child instanceof Element) {
        this.getItemsFromElement(child);
      }
    });

    if (addParagraphEnd) {
      this.temporaryItems.push("IGNORE_WHITESPACE_BEFORE");
      this.temporaryItems.push(...paragraphEnd(this.options));
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
      this.temporaryItems.push("IGNORE_WHITESPACE_BEFORE");
      if (this.options.addInfiniteGlueToFinalLine) {
        this.temporaryItems.push(glue(0, INFINITE_STRETCH, 0));
      }
      this.temporaryItems.push({
        ...forcedBreak(),
        skipWhenRendering: true,
      });
      this.temporaryItems.push("IGNORE_WHITESPACE_AFTER");
      return;
    }

    if (display === "inline" || display === "inline-block") {
      // Add box for margin/border/padding at start of box.
      const leftMargin =
        parseFloat(marginLeft!) +
        parseFloat(borderLeftWidth!) +
        parseFloat(paddingLeft!);
      if (leftMargin) {
        this.temporaryItems.push("MERGE_THIS_BOX_WITH_NEXT_BOX");
        this.temporaryItems.push({
          ...box(leftMargin),
          skipWhenRendering: true,
        });
      }

      if (display === "inline-block") {
        this.temporaryItems.push("START_NON_BREAKING_RANGE");
        this.temporaryItems.push("IGNORE_WHITESPACE_AFTER");
        this.getItemsFromNode(element, false);
        this.temporaryItems.push("IGNORE_WHITESPACE_BEFORE");
        this.temporaryItems.push("END_NON_BREAKING_RANGE");

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
        this.temporaryItems.push("MERGE_THIS_BOX_WITH_PREVIOUS_BOX");
        this.temporaryItems.push({
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
      this.temporaryItems.push(box(_width));
    }
  }

  /**
   * Processes all text in `itemsWithUnprocessedText` and
   * wraps the items in the text node in <span/> elements.
   */
  processText() {
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

      item.textNode.parentNode!.replaceChild(
        replacementFragment,
        item.textNode
      );
    }
  }
}
