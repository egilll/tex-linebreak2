import { Box, Glue, INFINITE_STRETCH, Penalty } from "src/breakLines";
import DOMTextMeasurer from "src/html/domTextMeasurer";
import { tagNode } from "src/html/tagNode";
import { TexLinebreakOptions } from "src/options";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";
import {
  collapseAdjacentTextGlueWidths,
  makeGlueAtEndsZeroWidth,
  makeGlueAtEndZeroWidth,
} from "src/utils/collapseGlue";
import {
  box,
  forcedBreak,
  glue,
  TextBox,
  TextGlue,
  TextItem,
} from "src/utils/items";

/**
 * Information used to construct a `Range` later.
 * Records character offset in a parent container.
 */
export interface DOMRangeOffset {
  // textOffsetInParagraph: number;
  // startOffset: number;
  // startContainer: Node;
  // endOffset: number;
  // endContainer: Node;
  span?: HTMLElement;
}

export type DOMBox = (Box | TextBox) & DOMRangeOffset;
export type DOMGlue = (Glue | TextGlue) &
  DOMRangeOffset & {
    /**
     * Used to not add unnecessary spans when
     * the whitespace will be collapsed anyways
     */
    skipWhenRendering?: boolean;
  };
export type DOMPenalty = Penalty & DOMRangeOffset;
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

/**
 * Multiple functions are placed inside the lexical scope of this function only
 * since we need to keep track of our current position in the paragraph's text.
 */
export function getItemsFromDOM(
  paragraphElement: HTMLElement,
  options: TexLinebreakOptions,
  domTextMeasureFn: InstanceType<typeof DOMTextMeasurer>["measure"]
): DOMItem[] {
  let items: DOMItem[] = [];
  let paragraphText = paragraphElement.textContent || "";
  /**
   * This is done since we need to be aware of the
   * surrounding text in order to find correct break points.
   *
   * TODO: Should stop on <br/> and <div/> boundaries
   */
  let textOffsetInParagraph: number = 0;

  function getItemsFromNode(node: Node, addParagraphEnd = true) {
    const children = Array.from(node.childNodes);

    let curOffset = 0;
    children.forEach((child) => {
      if (child instanceof Text) {
        getItemsFromText(child, false);
        curOffset += 1;
      } else if (child instanceof Element) {
        getItemsFromElement(child);
        curOffset += 1;
      }
    });

    if (addParagraphEnd) {
      makeGlueAtEndZeroWidth(items, true);

      const endOffset = node.childNodes.length;

      if (options.addInfiniteGlueToFinalLine) {
        /**
         * Add a synthetic glue that absorbs any
         * left-over space at the end of the last line.
         */
        items.push(itemWithOffset(glue(0, INFINITE_STRETCH, 0)));
      }

      /** Add a forced break to end the paragraph. */
      items.push(itemWithOffset(forcedBreak()));
    }
  }

  function getItemsFromElement(element: Element) {
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
      // items.push(itemWithOffset(box(0), element, 0, 1);
      return;
    }

    if (display === "inline") {
      // Add box for margin/border/padding at start of box.
      // TODO: Verify
      const leftMargin =
        parseFloat(marginLeft!) +
        parseFloat(borderLeftWidth!) +
        parseFloat(paddingLeft!);
      if (leftMargin > 0) {
        items.push(itemWithOffset(box(leftMargin) /*element, 0, 0*/));
      }

      // Add items for child nodes.
      getItemsFromNode(element, false);

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) +
        parseFloat(borderRightWidth!) +
        parseFloat(paddingRight!);
      if (rightMargin > 0) {
        const length = element.childNodes.length;
        items.push(
          itemWithOffset(box(rightMargin) /*element, length, length*/)
        );
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
      // items.push(itemWithOffset(box(_width), parentNode, startOffset, startOffset + 1);
      items.push(itemWithOffset(box(_width) /*element, 0, 1*/));
    }
  }

  function getItemsFromText(textNode: Text, addParagraphEnd = true) {
    const text = textNode.nodeValue!;
    const element = textNode.parentNode! as Element;

    const precedingText = paragraphText.slice(0, textOffsetInParagraph);
    const followingText = paragraphText.slice(
      textOffsetInParagraph + text.length
    );

    let textOffsetInThisNode = 0;
    const textItems = splitTextIntoItems(
      text,
      {
        ...options,
        measureFn: (word) => domTextMeasureFn(word, element, options),
        addParagraphEnd,
        collapseAllNewlines: true,
      },
      precedingText,
      followingText
    );

    let output = document.createDocumentFragment();
    textItems.forEach((item: TextItem) => {
      textOffsetInThisNode += (("text" in item && item.text) || "").length;
      let span: HTMLElement | undefined;

      if (item.type === "glue" || item.type === "box") {
        span = tagNode(document.createElement("span"));
        span.textContent = item.text || "";
      }

      items.push(itemWithOffset(item, span));

      if (span) {
        output.appendChild(span);
      }
    });

    textNode.parentNode!.replaceChild(output, textNode);

    textOffsetInParagraph += textOffsetInThisNode;
  }

  getItemsFromNode(paragraphElement);

  makeGlueAtEndsZeroWidth(items, 0, true);
  collapseAdjacentTextGlueWidths(items);
  return items;
}

/**
 * Helper function that limits boilerplate above.
 * Adds an item and makes a record of its DOM range
 */
function itemWithOffset(item: Box | Glue | Penalty, span?: HTMLElement) {
  // (Not using the spread operator here shaves off a
  // few dozen milliseconds as it would otherwise use Babel's polyfill)
  const output = item as DOMItem;
  output.span = span;
  return output;
}
