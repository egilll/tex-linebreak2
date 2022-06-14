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

export class GetItemsFromDOM {
  items: DOMItem[] = [];
  markGlueAsSkippedComingAfter = new Set<number>([0]);
  markGlueAsSkippedComingBefore = new Set<number>();

  constructor(
    public paragraphElement: HTMLElement,
    public options: TexLinebreakOptions,
    public domTextMeasureFn: InstanceType<typeof DOMTextMeasurer>["measure"]
  ) {
    this.getItemsFromNode(this.paragraphElement);

    makeGlueAtEndsZeroWidth(this.items, 0, true);
    collapseAdjacentTextGlueWidths(this.items);
  }

  getItemsFromNode(node: Node, addParagraphEnd = true) {
    const children = Array.from(node.childNodes);

    let curOffset = 0;
    children.forEach((child) => {
      if (child instanceof Text) {
        this.getItemsFromText(child, false);
        curOffset += 1;
      } else if (child instanceof Element) {
        this.getItemsFromElement(child);
        curOffset += 1;
      }
    });

    if (addParagraphEnd) {
      this.markGlueAsSkippedComingBefore.add(this.items.length);
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
      this.markGlueAsSkippedComingBefore.add(this.items.length);
      if (this.options.addInfiniteGlueToFinalLine) {
        this.items.push(glue(0, INFINITE_STRETCH, 0));
      }
      this.items.push({ ...forcedBreak(), skipWhenRendering: true });
      this.markGlueAsSkippedComingAfter.add(this.items.length);
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

      const startLength = this.items.length;

      // Add this.items for child nodes.
      this.getItemsFromNode(element, false);

      if (display === "inline-block") {
        makeNonBreaking(this.items, startLength - 1, this.items.length - 1);
        // (element as HTMLElement).classList.add(
        //   "texLinebreakNearestBlockElement"
        // );
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

  getItemsFromText(
    textNode: Text,

    addParagraphEnd = true
  ) {
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
        ...this.options,
        measureFn: (word) => this.domTextMeasureFn(word, element, this.options),
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

      this.items.push({ ...item, span });

      if (span) {
        replacementFragment.appendChild(span);
      }
    });

    textNode.parentNode!.replaceChild(replacementFragment, textNode);
  }
}
