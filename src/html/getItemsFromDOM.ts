import { Glue, Penalty, Box, MAX_COST } from 'src/breakLines';
import { TexLinebreakOptions } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';
import { TextItem, forcedBreak, glue, box, collapseAdjacentGlue } from 'src/helpers/util';

export interface NodeOffset {
  startOffsetNode: Node;
  /** Character offset of this item (box/penalty/glue) in the parent DOM node */
  startOffset: number;
  endOffsetNode: Node;
  endOffset: number;
}

export type DOMBox = Box & NodeOffset;
export type DOMGlue = Glue & NodeOffset;
export type DOMPenalty = Penalty & NodeOffset;
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

export class GetItemsFromDOM {
  #items: DOMItem[] = [];
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
    this.paragraphText = paragraphElement.textContent || '';
    this.getItemsFromNode(paragraphElement);
  }

  get items() {
    return collapseAdjacentGlue(this.#items);
  }

  addItemWithOffset(
    item: Box | Glue | Penalty,
    parentNode: Node,
    startOffset: number,
    endOffset: number,
  ) {
    this.#items.push({
      ...item,
      startOffsetNode: parentNode,
      startOffset,
      endOffsetNode: parentNode,
      endOffset,
    });
  }

  getItemsFromNode(node: Node, addParagraphEnd = true) {
    const children = Array.from(node.childNodes);

    children.forEach((child) => {
      if (child instanceof Text) {
        this.getItemsFromText(child, false);
      } else if (child instanceof Element) {
        this.getItemsFromElement(child);
      }
    });

    if (addParagraphEnd) {
      const endOffset = node.childNodes.length;

      // Add a synthetic glue that absorbs any left-over space at the end of the
      // last line.
      this.addItemWithOffset(glue(0, 0, MAX_COST), node, endOffset, endOffset);

      // Add a forced break to end the paragraph.
      this.addItemWithOffset(forcedBreak(), node, endOffset, endOffset);
    }
  }

  getItemsFromElement(element: Element) {
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
        this.addItemWithOffset(box(leftMargin), element, 0, 0);
      }

      // Add this.items for child nodes.
      this.getItemsFromNode(element, false);

      // Add box for margin/border/padding at end of box.
      const rightMargin =
        parseFloat(marginRight!) + parseFloat(borderRightWidth!) + parseFloat(paddingRight!);
      if (rightMargin > 0) {
        const length = element.childNodes.length;
        this.addItemWithOffset(box(rightMargin), element, length, length);
      }
    } else {
      // Treat this item as an opaque box.
      this.addItemWithOffset(box(parseFloat(width!)), element, 0, 1);
    }
  }

  getItemsFromText(textNode: Text, addParagraphEnd = true) {
    const text = textNode.nodeValue!;
    const element = textNode.startOffsetNode! as Element;

    const precedingText = this.paragraphText.slice(0, this.textOffsetInParagraph);
    const followingText = this.paragraphText.slice(this.textOffsetInParagraph + text.length);

    let textOffsetInThisNode = 0;
    const textItems = splitTextIntoItems(
      text,
      {
        ...this.options,
        measureFn: (word) => this.domTextMeasureFn(word, element),
        addParagraphEnd,
        isHTML: true,
      },
      precedingText,
      followingText,
    );

    console.log(text);

    textItems.forEach((item: TextItem) => {
      const startOffset = textOffsetInThisNode;
      textOffsetInThisNode += ('text' in item ? item.text : '').length;
      console.log({ item });
      this.addItemWithOffset(item, textNode, startOffset, textOffsetInThisNode);
    });

    console.log({ i: this.#items });

    this.textOffsetInParagraph += textOffsetInThisNode;
  }
}
