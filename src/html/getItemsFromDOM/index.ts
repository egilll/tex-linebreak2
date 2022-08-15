import { Box, Glue, Penalty } from "src/breakLines";
import DOMTextMeasurer from "src/html/DOMTextMeasurer";
import {
  processControlItems,
  TemporaryControlItem,
} from "src/html/getItemsFromDOM/controlItems";
import {
  processText,
  TemporaryUnprocessedTextNode,
} from "src/html/getItemsFromDOM/textNodes";
import { addItemsFromNode } from "src/html/getItemsFromDOM/traverse";
import { TexLinebreakOptions } from "src/options";
import { collapseAdjacentDOMWhitespace } from "src/utils/collapseGlue";
import { TextBox, TextGlue } from "src/utils/items";

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
export function getItemsFromDOMAndWrapInSpans(
  paragraphElement: HTMLElement,
  options: TexLinebreakOptions,
  domTextMeasureFn: InstanceType<typeof DOMTextMeasurer>["measure"]
) {
  const temporaryItems: (
    | DOMItem
    | TemporaryUnprocessedTextNode
    | TemporaryControlItem
  )[] = [];

  temporaryItems.push({ type: "IGNORE_WHITESPACE_AFTER" });
  addItemsFromNode(paragraphElement, temporaryItems, {
    ...options,
    measureFn: (word) => domTextMeasureFn(word, paragraphElement, options),
  });
  temporaryItems.push({ type: "IGNORE_WHITESPACE_BEFORE" });

  const temporaryItemsProcessedText = processText(
    temporaryItems,
    domTextMeasureFn
  );
  const output = processControlItems(temporaryItemsProcessedText);
  collapseAdjacentDOMWhitespace(output);
  return output;
}
