import { INFINITE_STRETCH } from "src/breakLines";
import { box, forcedBreak, glue, paragraphEnd } from "src/utils/items";

export function getItemsFromNode(node: Node, addParagraphEnd = true) {
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

export function getItemsFromElement(element: Element) {
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
    this.temporaryItems.push({ type: "IGNORE_WHITESPACE_AFTER" });
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
      this.temporaryItems.push({ type: "IGNORE_WHITESPACE_AFTER" });
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
