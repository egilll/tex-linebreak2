import { INFINITE_STRETCH } from "src/breakLines";
import { TemporaryControlItem } from "src/html/getItemsFromDOM/controlItems";
import { DOMItem } from "src/html/getItemsFromDOM/index";
import { TemporaryUnprocessedTextNode } from "src/html/getItemsFromDOM/textNodes";
import { TexLinebreakOptions } from "src/options";
import { box, forcedBreak, glue, paragraphEnd } from "src/utils/items";

export function addItemsFromNode(
  node: Node,
  items: (DOMItem | TemporaryUnprocessedTextNode | TemporaryControlItem)[],
  options: TexLinebreakOptions,
  addParagraphEnd = true
) {
  Array.from(node.childNodes).forEach((child) => {
    if (child instanceof Text) {
      items.push({
        text: child.nodeValue || "",
        textNode: child,
        element: node as Element,
      });
    } else if (child instanceof Element) {
      addItemsFromElement(child, items, options);
    }
  });

  if (addParagraphEnd) {
    items.push({ type: "IGNORE_WHITESPACE_BEFORE" });
    items.push(...paragraphEnd(options));
  }
}

export function addItemsFromElement(
  element: Element,
  items: (DOMItem | TemporaryUnprocessedTextNode | TemporaryControlItem)[],
  options: TexLinebreakOptions
) {
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
    items.push({ type: "IGNORE_WHITESPACE_BEFORE" });
    if (options.addInfiniteGlueToFinalLine) {
      items.push(glue(0, INFINITE_STRETCH, 0));
    }
    items.push({
      ...forcedBreak(),
      skipWhenRendering: true,
    });
    items.push({ type: "IGNORE_WHITESPACE_AFTER" });
    return;
  }

  if (display === "inline" || display === "inline-block") {
    // Add box for margin/border/padding at start of box.
    const leftMargin =
      parseFloat(marginLeft!) +
      parseFloat(borderLeftWidth!) +
      parseFloat(paddingLeft!);
    if (leftMargin) {
      items.push({ type: "MOVE_THIS_BOX_ADJACENT_TO_NEXT_BOX" });
      items.push({
        ...box(leftMargin),
        skipWhenRendering: true,
      });
    }

    if (display === "inline-block") {
      items.push({ type: "START_NON_BREAKING_RANGE" });
      items.push({ type: "IGNORE_WHITESPACE_AFTER" });
      addItemsFromNode(element, items, options, false);
      items.push({ type: "IGNORE_WHITESPACE_BEFORE" });
      items.push({ type: "END_NON_BREAKING_RANGE" });

      // (element as HTMLElement).classList.add(
      //   "texLinebreakNearestBlockElement"
      // );
    } else {
      addItemsFromNode(element, items, options, false);
    }

    // Add box for margin/border/padding at end of box.
    const rightMargin =
      parseFloat(marginRight!) +
      parseFloat(borderRightWidth!) +
      parseFloat(paddingRight!);
    if (rightMargin) {
      items.push({ type: "MOVE_THIS_BOX_ADJACENT_TO_PREVIOUS_BOX" });
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
    items.push(box(_width));
  }
}
