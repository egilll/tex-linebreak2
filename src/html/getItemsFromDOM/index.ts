import { Box, Glue, Penalty } from "src/breakLines";
import DOMTextMeasurer from "src/html/domTextMeasurer";
import {
  processControlItems,
  TemporaryControlItem,
} from "src/html/getItemsFromDOM/controlItems";
import {
  processText,
  TemporaryUnprocessedTextNode,
} from "src/html/getItemsFromDOM/processTextNodes";
import { getItemsFromNode } from "src/html/getItemsFromDOM/traverse";
import { TexLinebreakOptions } from "src/options";
import { collapseAdjacendDOMWhitespace } from "src/utils/collapseGlue";
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
    this.temporaryItems.push({ type: "IGNORE_WHITESPACE_AFTER" });
    getItemsFromNode(this.paragraphElement);
    this.temporaryItems.push("IGNORE_WHITESPACE_BEFORE");

    processText();
    const output = processControlItems();
    collapseAdjacendDOMWhitespace(output);

    if (process.env.NODE_ENV === "development") {
      console.log(this.temporaryItems);
    }
    return output;
  }
}
