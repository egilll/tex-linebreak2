import { Box, Glue, INFINITE_STRETCH, Penalty } from "src/breakLines";
import DOMTextMeasurer from "src/html/domTextMeasurer";
import { tagNode } from "src/html/tagNode";
import { TexLinebreakOptions } from "src/options";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";
import {
  collapseAdjacentTextGlueWidths,
  makeGlueAtEndsZeroWidth,
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
import { makeNonBreaking } from "src/utils/utils";

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

  let markGlueAsSkippedComingAfter = new Set<number>([0]);
  let markGlueAsSkippedComingBefore = new Set<number>();

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
      markGlueAsSkippedComingBefore.add(items.length);
      items.push(...paragraphEnd(options));
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
      return;
    }

    /** <br/> elements */
    if (element.tagName === "BR") {
      markGlueAsSkippedComingBefore.add(items.length);
      if (options.addInfiniteGlueToFinalLine) {
        items.push(glue(0, INFINITE_STRETCH, 0));
      }
      items.push({ ...forcedBreak(), skipWhenRendering: true });
      markGlueAsSkippedComingAfter.add(items.length);
      return;
    }

    if (display === "inline" || display === "inline-block") {
      // Add box for margin/border/padding at start of box.
      // TODO: Verify.
      const leftMargin =
        parseFloat(marginLeft!) +
        parseFloat(borderLeftWidth!) +
        parseFloat(paddingLeft!);
      if (leftMargin > 0) {
        items.push({
          ...box(leftMargin),
          skipWhenRendering: true,
        });
      }

      let startLength = items.length;

      // Add items for child nodes.
      getItemsFromNode(element, false);

      if (display === "inline-block") {
        makeNonBreaking(items, startLength - 1, items.length - 1);
        (element as HTMLElement).classList.add(
          "texLinebreakNearestBlockElement"
        );
      }

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) +
        parseFloat(borderRightWidth!) +
        parseFloat(paddingRight!);
      if (rightMargin > 0) {
        items.push({
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
      // items.push(itemWithOffset(box(_width), parentNode, startOffset, startOffset + 1);
      items.push(itemWithSpan(box(_width) /*element, 0, 1*/));
      textOffsetInParagraph += element.textContent?.length || 0;
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

    let replacementFragment = document.createDocumentFragment();
    textItems.forEach((item: TextItem) => {
      textOffsetInThisNode += (("text" in item && item.text) || "").length;
      let span: HTMLElement | undefined;

      if (item.type === "glue" || item.type === "box") {
        span = tagNode(document.createElement("span"));
        span.textContent = item.text || "";
      }

      items.push(itemWithSpan(item, span));

      if (span) {
        replacementFragment.appendChild(span);
      }
    });

    textNode.parentNode!.replaceChild(replacementFragment, textNode);

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
function itemWithSpan(item: Box | Glue | Penalty, span?: HTMLElement) {
  // (Not using the spread operator here shaves off a
  // few dozen milliseconds as it would otherwise use Babel's polyfill)
  const output = item as DOMItem;
  output.span = span;
  return output;
}
