import { Glue, Penalty, Box, MAX_COST } from 'src/breakLines';
import { HelperOptions } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';
import { TextInputItem, forcedBreak } from 'src/helpers/util';

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
    this.addItemsForNode(paragraphElement);
  }

  addItemsForNode(node: Node, addParagraphEnd = true) {
    const children = Array.from(node.childNodes);

    children.forEach((child) => {
      if (child instanceof Text) {
        this.addItemsForTextNode(child, false);
      } else if (child instanceof Element) {
        this.addItemsForElement(child);
      }
    });

    if (addParagraphEnd) {
      const endOffset = node.childNodes.length;

      // Add a synthetic glue that absorbs any left-over space at the end of the
      // last line.
      this.items.push({
        type: 'glue',
        width: 0,
        shrink: 0,
        stretch: MAX_COST,
        parentDOMNode: node,
        startOffset: endOffset,
        endOffset,
      });

      // Add a forced break to end the paragraph.
      this.items.push({ ...forcedBreak(), parentDOMNode: node, startOffset: endOffset, endOffset });
    }
  }

  addItemsForElement(element: Element) {
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
        this.items.push({
          type: 'box',
          width: leftMargin,
          parentDOMNode: element,
          startOffset: 0,
          endOffset: 0,
        });
      }

      // Add this.items for child nodes.
      this.addItemsForNode(element, false);

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) + parseFloat(borderRightWidth!) + parseFloat(paddingRight!);
      if (rightMargin > 0) {
        const length = element.childNodes.length;
        this.items.push({
          type: 'box',
          width: rightMargin,
          parentDOMNode: element,
          startOffset: length,
          endOffset: length,
        });
      }
    } else {
      // Treat this item as an opaque box.
      this.items.push({
        type: 'box',
        width: parseFloat(width!),
        parentDOMNode: element,
        startOffset: 0,
        endOffset: 1,
      });
    }
  }

  addItemsForTextNode(node: Text, addParagraphEnd = true) {
    const text = node.nodeValue!;
    const el = node.parentNode! as Element;
    let textOffset = 0;
    splitTextIntoItems(text, {
      ...this.options,
      measureFn: (word) => this.domTextMeasureFn(word, el),
      addParagraphEnd,
      isHTML: true,
    }).forEach((item: TextInputItem) => {
      const startOffset = textOffset;
      textOffset += ('text' in item ? item.text : '').length;
      this.items.push({
        ...item,
        parentDOMNode: node,
        startOffset: startOffset,
        endOffset: textOffset,
      });
    });
  }
}
