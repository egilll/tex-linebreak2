import { Glue, Penalty, Box, MAX_COST } from 'src/breakLines';
import { HelperOptions } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';
import { TextInputItem, forcedBreak } from 'src/helpers/util';
import DOMTextMeasurer from 'src/util/domTextMeasurer';

export interface NodeOffset {
  parentDOMNode: Node;
  /**
   * Character offset of this item (box/penalty/glue) in the parent DOM node
   */
  startOffset: number;
  endOffset: number;
}

export type DOMBox = Box & NodeOffset;
export type DOMGlue = Glue & NodeOffset;
export type DOMPenalty = Penalty & NodeOffset;
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

export class GetItemsFromDom {
  items: DOMItem[] = [];
  paragraphElementText: string;
  currentTextIndex: number = 0;
  constructor(
    public paragraphElement: HTMLElement,
    public options: HelperOptions,
    public domTextMeasureFn: (text: string, context: Element) => number,
  ) {
    this.paragraphElementText = paragraphElement.textContent || '';
  }
}

/**
 * Add layout items for input to `breakLines` for `node` to `items`.
 *
 * This function, `addItemsForTextNode` and `addItemsForElement` take an
 * existing array as a first argument to avoid allocating a large number of
 * small arrays.
 */
export function addItemsForNode(
  items: DOMItem[],
  node: Node,
  options: HelperOptions = {},
  addParagraphEnd = true,
) {
  const children = Array.from(node.childNodes);

  children.forEach((child) => {
    if (child instanceof Text) {
      addItemsForTextNode(items, child, { ...options, addParagraphEnd: false });
    } else if (child instanceof Element) {
      addItemsForElement(items, child, options);
    }
  });

  if (addParagraphEnd) {
    const endOffset = node.childNodes.length;

    // Add a synthetic glue that absorbs any left-over space at the end of the
    // last line.
    items.push({
      type: 'glue',
      width: 0,
      shrink: 0,
      stretch: MAX_COST,
      parentDOMNode: node,
      startOffset: endOffset,
      endOffset,
    });

    // Add a forced break to end the paragraph.
    items.push({ ...forcedBreak(), parentDOMNode: node, startOffset: endOffset, endOffset });
  }
}

/**
 * Add layout items for `element` and its descendants to `items`.
 */
export function addItemsForElement(items: DOMItem[], element: Element, options: HelperOptions) {
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
      items.push({
        type: 'box',
        width: leftMargin,
        parentDOMNode: element,
        startOffset: 0,
        endOffset: 0,
      });
    }

    // Add items for child nodes.
    addItemsForNode(items, element, options, false);

    // Add box for margin/border/padding at end of box.
    const rightMargin =
      parseFloat(marginRight!) + parseFloat(borderRightWidth!) + parseFloat(paddingRight!);
    if (rightMargin > 0) {
      const length = element.childNodes.length;
      items.push({
        type: 'box',
        width: rightMargin,
        parentDOMNode: element,
        startOffset: length,
        endOffset: length,
      });
    }
  } else {
    // Treat this item as an opaque box.
    items.push({
      type: 'box',
      width: parseFloat(width!),
      parentDOMNode: element,
      startOffset: 0,
      endOffset: 1,
    });
  }
}

/**
 * Add layout items for `node` to `items`.
 */
export function addItemsForTextNode(items: DOMItem[], node: Text, options: HelperOptions = {}) {
  const text = node.nodeValue!;
  const el = node.parentNode! as Element;
  let textOffset = 0;
  splitTextIntoItems(text, {
    ...options,
    measureFn: (word) => options.measureFn!(word, el),
    isHTML: true,
  }).forEach((item: TextInputItem) => {
    const startOffset = textOffset;
    textOffset += ('text' in item ? item.text : '').length;
    items.push({
      ...item,
      parentDOMNode: node,
      startOffset: startOffset,
      endOffset: textOffset,
    });
  });
}
