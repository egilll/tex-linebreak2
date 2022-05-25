import { InputItem, Box, Glue, Penalty } from 'src/breakLines';
import { textNodesInRange } from 'src/util/range';
import { forcedBreak } from 'src/helpers/util';

const NODE_TAG = 'insertedByTexLinebreak';

export interface NodeOffset {
  /** A DOM node */
  node: Node;
  start: number;
  end: number;
}

export type DOMBox = Box & NodeOffset;
export type DOMGlue = Glue & NodeOffset;
export type DOMPenalty = Penalty & NodeOffset;
export type DOMItem = DOMBox | DOMGlue | DOMPenalty;

export interface ElementBreakpoints {
  el: HTMLElement;
  items: DOMItem[];
  breakpoints: number[];
  lineWidth: number;
}

/**
 * Add layout items for `node` to `items`.
 */
export function addItemsForTextNode(
  items: DOMItem[],
  node: Text,
  measureFn: (context: Element, word: string) => number,
  hyphenateFn?: (word: string) => string[],
) {
  const text = node.nodeValue!;
  const el = node.parentNode! as Element;

  const spaceWidth = measureFn(el, ' ');
  const shrink = Math.max(0, spaceWidth - 3);
  const hyphenWidth = measureFn(el, '-');
  const isSpace = (word: string) => /\s/.test(word.charAt(0));

  const chunks = text.split(/(\s+)/).filter((w) => w.length > 0);
  let textOffset = 0;

  chunks.forEach((w) => {
    if (isSpace(w)) {
      const glue: DOMGlue = {
        type: 'glue',
        width: spaceWidth,
        shrink,
        stretch: spaceWidth,
        node,
        start: textOffset,
        end: textOffset + w.length,
      };
      items.push(glue);
      textOffset += w.length;
      return;
    }

    if (hyphenateFn) {
      const chunks = hyphenateFn(w);
      chunks.forEach((c, i) => {
        const box: DOMBox = {
          type: 'box',
          width: measureFn(el, c),
          node,
          start: textOffset,
          end: textOffset + c.length,
        };
        textOffset += c.length;
        items.push(box);
        if (i < chunks.length - 1) {
          const hyphen: DOMPenalty = {
            type: 'penalty',
            width: hyphenWidth,
            cost: 10,
            flagged: true,
            node,
            start: textOffset,
            end: textOffset,
          };
          items.push(hyphen);
        }
      });
    } else {
      const box: DOMBox = {
        type: 'box',
        width: measureFn(el, w),
        node,
        start: textOffset,
        end: textOffset + w.length,
      };
      textOffset += w.length;
      items.push(box);
    }
  });
}

/**
 * Add layout items for `element` and its descendants to `items`.
 */
export function addItemsForElement(
  items: DOMItem[],
  element: Element,
  measureFn: (context: Element, word: string) => number,
  hyphenateFn?: (word: string) => string[],
) {
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
      items.push({ type: 'box', width: leftMargin, node: element, start: 0, end: 0 });
    }

    // Add items for child nodes.
    addItemsForNode(items, element, measureFn, hyphenateFn, false);

    // Add box for margin/border/padding at end of box.
    const rightMargin =
      parseFloat(marginRight!) + parseFloat(borderRightWidth!) + parseFloat(paddingRight!);
    if (rightMargin > 0) {
      const length = element.childNodes.length;
      items.push({ type: 'box', width: rightMargin, node: element, start: length, end: length });
    }
  } else {
    // Treat this item as an opaque box.
    items.push({
      type: 'box',
      width: parseFloat(width!),
      node: element,
      start: 0,
      end: 1,
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
  measureFn: (context: Element, word: string) => number,
  hyphenateFn?: (word: string) => string[],
  addParagraphEnd = true,
) {
  const children = Array.from(node.childNodes);

  children.forEach((child) => {
    if (child instanceof Text) {
      addItemsForTextNode(items, child, measureFn, hyphenateFn);
    } else if (child instanceof Element) {
      addItemsForElement(items, child, measureFn, hyphenateFn);
    }
  });

  if (addParagraphEnd) {
    const end = node.childNodes.length;

    // Add a synthetic glue that absorbs any left-over space at the end of the
    // last line.
    items.push({ type: 'glue', width: 0, shrink: 0, stretch: 1000, node, start: end, end });

    // Add a forced break to end the paragraph.
    items.push({ ...forcedBreak(), node, start: end, end });
  }
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
 * Calculate the actual width of each line and the number of spaces that can be
 * stretched or shrunk to adjust the width.
 */
export function lineWidthsAndGlueCounts(items: InputItem[], breakpoints: number[]) {
  const widths: number[] = [];
  const glueCounts: number[] = [];

  for (let b = 0; b < breakpoints.length - 1; b++) {
    let actualWidth = 0;
    let glueCount = 0;

    const start = b === 0 ? breakpoints[b] : breakpoints[b] + 1;
    for (let p = start; p <= breakpoints[b + 1]; p++) {
      const item = items[p];
      if (item.type === 'box') {
        actualWidth += item.width;
      } else if (item.type === 'glue' && p !== start && p !== breakpoints[b + 1]) {
        actualWidth += item.width;
        ++glueCount;
      } else if (item.type === 'penalty' && p === breakpoints[b + 1]) {
        actualWidth += item.width;
      }
    }

    widths.push(actualWidth);
    glueCounts.push(glueCount);
  }

  return [widths, glueCounts];
}

/**
 * Mark a node as having been created by `justifyContent`.
 */
export function tagNode(node: Node) {
  (node as any)[NODE_TAG] = true;
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
export function taggedChildren(node: Node): Node[] {
  const children = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (isTaggedNode(child)) {
      children.push(child);
    }
    if (child.childNodes.length > 0) {
      children.push(...taggedChildren(child));
    }
  }
  return children;
}

export function isTextOrInlineElement(node: Node) {
  if (node instanceof Text) {
    return true;
  } else if (node instanceof Element) {
    const style = getComputedStyle(node);
    return style.display === 'inline';
  } else {
    return false;
  }
}

/**
 * Wrap text nodes in a range and adjust the inter-word spacing.
 *
 * @param r - The range to wrap
 * @param wordSpacing - The additional spacing to add between words in pixels
 */
export function addWordSpacing(r: Range, wordSpacing: number) {
  // Collect all text nodes in range, skipping any non-inline elements and
  // their children because those are treated as opaque blocks by the line-
  // breaking step.
  const texts = textNodesInRange(r, isTextOrInlineElement);

  for (let t of texts) {
    const wrapper = document.createElement('span');
    tagNode(wrapper);
    wrapper.style.wordSpacing = `${wordSpacing}px`;
    t.parentNode!.replaceChild(wrapper, t);
    wrapper.appendChild(t);
  }

  return texts;
}
