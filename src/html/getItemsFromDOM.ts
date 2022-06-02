import { INFINITE_STRETCH } from 'src/breakLines/breakLines';
import { Box, Glue, Items, Penalty } from 'src/items';
import { TexLinebreakOptions } from 'src/options';
import { splitTextIntoItems } from 'src/splitTextIntoItems/splitTextIntoItems';
import { box, forcedBreak, glue, TextBox, TextGlue, TextItem } from 'src/utils';

export interface DomOffset {
  /**
   * Character offset of this item (box/penalty/glue)
   * in the parent DOM node, used to create a `Range`
   */
  startOffset: number;
  startContainer: Node;
  endOffset: number;
  endContainer: Node;
}

export type DOMBox = (Box | TextBox) & { domOffset: DomOffset };
export type DOMGlue = (Glue | TextGlue) & { domOffset: DomOffset };
export type DOMPenalty = Penalty & { domOffset: DomOffset };
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

export class GetItemsFromDOM {
  items: Items;
  paragraphText: string;
  /**
   * This is done since we need to be aware of the
   * surrounding text in order to find correct break points.
   */
  textOffsetInParagraph: number = 0;
  constructor(
    public paragraphElement: HTMLElement,
    public options: TexLinebreakOptions,
    public domTextMeasureFn: (text: string, context: Element) => number,
  ) {
    this.items = new Items(options);
    this.paragraphText = paragraphElement.textContent || '';
    this.getItemsFromNode(paragraphElement);
  }

  // getItems() {
  //   return collapseAdjacentGlue(this.items);
  // }

  /** Adds an item and makes a record of its DOM range */
  addItemWithDomOffset(
    item: Box | Glue | Penalty,
    startContainer: Node,
    startOffset: number,
    endOffset: number,
  ) {
    this.items.add({
      ...item,
      domOffset: {
        startContainer: startContainer,
        startOffset,
        endContainer: startContainer,
        endOffset,
      },
    });
  }

  getItemsFromNode(node: Node, addParagraphEnd = true) {
    const children = Array.from(node.childNodes);

    let curOffset = 0;
    children.forEach((child) => {
      if (child instanceof Text) {
        this.getItemsFromText(child, false);
        curOffset += 1;
      } else if (child instanceof Element) {
        this.getItemsFromElement(child, node, curOffset);
        curOffset += 1;
      }
    });

    if (addParagraphEnd) {
      const endOffset = node.childNodes.length;
      /**
       * Add a synthetic glue that absorbs any
       * left-over space at the end of the last line.
       */
      this.addItemWithDomOffset(glue(0, 0, INFINITE_STRETCH), node, endOffset, endOffset);

      /** Add a forced break to end the paragraph. */
      this.addItemWithDomOffset(forcedBreak(), node, endOffset, endOffset);
    }
  }

  getItemsFromElement(element: Element, parentNode: Node, startOffset: number) {
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
        this.addItemWithDomOffset(box(leftMargin), element, 0, 0);
      }

      // Add items for child nodes.
      this.getItemsFromNode(element, false);

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) + parseFloat(borderRightWidth!) + parseFloat(paddingRight!);
      if (rightMargin > 0) {
        const length = element.childNodes.length;
        this.addItemWithDomOffset(box(rightMargin), element, length, length);
      }
    } else {
      // Treat this item as an opaque box.
      this.addItemWithDomOffset(box(parseFloat(width!)), element, 0, 1);
      // this.addItem(box(parseFloat(width!)), parentNode, startOffset, startOffset + 1);
    }
  }

  getItemsFromText(textNode: Text, addParagraphEnd = true) {
    const text = textNode.nodeValue!;
    const element = textNode.parentNode! as Element;

    const precedingText = this.paragraphText.slice(0, this.textOffsetInParagraph);
    const followingText = this.paragraphText.slice(this.textOffsetInParagraph + text.length);

    let textOffsetInThisNode = 0;
    const textItems = splitTextIntoItems(
      text,
      {
        ...this.options,
        measureFn: (word) => this.domTextMeasureFn(word, element),
        addParagraphEnd,
        collapseNewlines: true,
      },
      precedingText,
      followingText,
    );

    textItems.forEach((item: TextItem) => {
      const startOffset = textOffsetInThisNode;
      textOffsetInThisNode += ('text' in item ? item.text : '').length;
      this.addItemWithDomOffset(item, textNode, startOffset, textOffsetInThisNode);
    });

    this.textOffsetInParagraph += textOffsetInThisNode;
  }
}
