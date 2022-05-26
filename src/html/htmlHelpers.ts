import { Box, Glue, Penalty } from 'src/breakLines';
import { textNodesInRange } from 'src/util/range';
import { TextInputItem } from 'src/helpers/util';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems';
import { Line } from 'src/helpers';
import { HelperOptions } from 'src/helpers/options';

const NODE_TAG = 'insertedByTexLinebreak';

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
    ignoreNewlines: true,
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
      addItemsForTextNode(items, child, options);
    } else if (child instanceof Element) {
      addItemsForElement(items, child, options);
    }
  });

  /* TODO!!!!! Child nodes do not have this!!!! */
  // if (addParagraphEnd) {
  //   const end = node.childNodes.length;
  //
  //   // Add a synthetic glue that absorbs any left-over space at the end of the
  //   // last line.
  //   items.push({ type: 'glue', width: 0, shrink: 0, stretch: MAX_COST, node, start: end, end });
  //
  //   // Add a forced break to end the paragraph.
  //   items.push({ ...forcedBreak(), node, start: end, end });
  // }
}

export function elementLineWidth(el: HTMLElement) {
  const { width, boxSizing, paddingLeft, paddingRight } = getComputedStyle(el);
  let w = parseFloat(width!);
  if (boxSizing === 'border-box') {
    w -= parseFloat(paddingLeft!);
    w -= parseFloat(paddingRight!);
  }
  return w;
}

/**
 * Mark a node as having been created by `justifyContent`.
 */
export function tagNode<T extends Node>(node: T): T {
  (node as any)[NODE_TAG] = true;
  return node;
}

/**
 * Return `true` if `node` was created by `justifyContent`.
 */
export function isTaggedNode(node: Node) {
  return node.hasOwnProperty(NODE_TAG);
}

/**
 * Return all descendants of `node` created by `justifyContent`.
 */
export function getTaggedChildren(node: Node): Node[] {
  const children = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (isTaggedNode(child)) {
      children.push(child);
    }
    if (child.childNodes.length > 0) {
      children.push(...getTaggedChildren(child));
    }
  }
  return children;
}

export function isTextOrInlineElement(node: Node) {
  if (node instanceof Text) {
    return true;
  } else if (node instanceof Element) {
    return getComputedStyle(node).display === 'inline';
  } else {
    return false;
  }
}

/**
 * Wrap text nodes in a range and adjust the inter-word spacing.
 */
export function addWordSpacing(range: Range, line: Line) {
  // Collect all text nodes in range, skipping any non-inline elements and
  // their children because those are treated as opaque blocks by the line-
  // breaking step.
  const texts = textNodesInRange(range, isTextOrInlineElement);

  // /* tmp test for right-align */
  // if (wordSpacing > 0) {
  //   // todo: has to be relative to the line width
  //   wordSpacing /= 2;
  // }

  texts.forEach((t, i) => {
    const wrapper = tagNode(document.createElement('span'));
    wrapper.style.wordSpacing = `${line.extraSpacePerGlue}px`;
    if (i === 0 && line.leftHangingPunctuationWidth) {
      wrapper.style.marginLeft = `-${line.leftHangingPunctuationWidth}px`;
    }
    t.parentNode!.replaceChild(wrapper, t);
    wrapper.appendChild(t);
  });

  return texts;
}
