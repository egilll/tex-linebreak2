import { Box, Glue, INFINITE_STRETCH, Penalty } from 'src/breakLines/breakLines';
import { TexLinebreakOptions } from 'src/options';
import { splitTextIntoItems } from 'src/splitTextIntoItems/splitTextIntoItems';
import { box, forcedBreak, glue, normalizeItems, TextBox, TextGlue, TextItem } from 'src/utils';

/**
 * Information used to construct a `Range` later.
 * Records character offset in a parent container.
 */
export interface DOMRangeOffset {
  startOffset: number;
  startContainer: Node;
  endOffset: number;
  endContainer: Node;
}

export type DOMBox = (Box | TextBox) & DOMRangeOffset;
export type DOMGlue = (Glue | TextGlue) & DOMRangeOffset;
export type DOMPenalty = Penalty & DOMRangeOffset;
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

/**
 * Multiple functions are placed inside the lexical scope of this function only
 * since we need to keep track of our current position in the paragraph's text.
 */
export function getItemsFromDOM(
  paragraphElement: HTMLElement,
  options: TexLinebreakOptions,
  domTextMeasureFn: (text: string, context: Element) => number,
): DOMItem[] {
  let items: DOMItem[] = [];
  let paragraphText = paragraphElement.textContent || '';
  /**
   * This is done since we need to be aware of the
   * surrounding text in order to find correct break points.
   */
  let textOffsetInParagraph: number = 0;

  /**
   * Helper function that limits boilerplate below.
   * Adds an item and makes a record of its DOM range
   */
  function addItemWithOffset(
    item: Box | Glue | Penalty,
    startContainer: Node,
    startOffset: number,
    endOffset: number,
  ) {
    items.push({
      ...item,
      startContainer: startContainer,
      startOffset,
      endContainer: startContainer,
      endOffset,
    });
  }

  function getItemsFromNode(node: Node, addParagraphEnd = true) {
    const children = Array.from(node.childNodes);

    let curOffset = 0;
    children.forEach((child) => {
      if (child instanceof Text) {
        getItemsFromText(child, false);
        curOffset += 1;
      } else if (child instanceof Element) {
        getItemsFromElement(child, node, curOffset);
        curOffset += 1;
      }
    });

    if (addParagraphEnd) {
      const endOffset = node.childNodes.length;
      /**
       * Add a synthetic glue that absorbs any
       * left-over space at the end of the last line.
       */
      addItemWithOffset(glue(0, INFINITE_STRETCH, 0), node, endOffset, endOffset);

      /** Add a forced break to end the paragraph. */
      addItemWithOffset(forcedBreak(), node, endOffset, endOffset);
    }
  }

  function getItemsFromElement(element: Element, parentNode: Node, startOffset: number) {
    const {
      display,
      width,
      paddingLeft,
      paddingRight,
      marginLeft,
      marginRight,
      borderLeftWidth,
      borderRightWidth,
    } = getComputedStyle(element);

    if (display === 'inline') {
      // Add box for margin/border/padding at start of box.
      const leftMargin =
        parseFloat(marginLeft!) + parseFloat(borderLeftWidth!) + parseFloat(paddingLeft!);
      if (leftMargin > 0) {
        addItemWithOffset(box(leftMargin), element, 0, 0);
      }

      // Add items for child nodes.
      getItemsFromNode(element, false);

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) + parseFloat(borderRightWidth!) + parseFloat(paddingRight!);
      if (rightMargin > 0) {
        const length = element.childNodes.length;
        addItemWithOffset(box(rightMargin), element, length, length);
      }
    } else {
      // Treat this item as an opaque box.
      addItemWithOffset(box(parseFloat(width!)), element, 0, 1);
      // addItem(box(parseFloat(width!)), parentNode, startOffset, startOffset + 1);
    }
  }

  function getItemsFromText(textNode: Text, addParagraphEnd = true) {
    const text = textNode.nodeValue!;
    const element = textNode.parentNode! as Element;

    const precedingText = paragraphText.slice(0, textOffsetInParagraph);
    const followingText = paragraphText.slice(textOffsetInParagraph + text.length);

    let textOffsetInThisNode = 0;
    const textItems = splitTextIntoItems(
      text,
      {
        ...options,
        measureFn: (word) => domTextMeasureFn(word, element),
        addParagraphEnd,
        collapseNewlines: true,
      },
      precedingText,
      followingText,
    );

    textItems.forEach((item: TextItem) => {
      const startOffset = textOffsetInThisNode;
      textOffsetInThisNode += (('text' in item && item.text) || '').length;
      addItemWithOffset(item, textNode, startOffset, textOffsetInThisNode);
    });

    textOffsetInParagraph += textOffsetInThisNode;
  }

  getItemsFromNode(paragraphElement);
  return normalizeItems(items);
}
