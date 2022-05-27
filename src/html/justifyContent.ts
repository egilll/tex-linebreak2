import DOMTextMeasurer from 'src/util/dom-text-measurer';
import {
  getTaggedChildren,
  elementLineWidth,
  DOMItem,
  addItemsForNode,
  tagNode,
  addWordSpacingToLine,
} from 'src/html/htmlHelpers';
import { TexLinebreak, Line } from 'src/helpers';
import { HelperOptions } from 'src/helpers/options';

/**
 * Reverse the changes made to an element by `justifyContent`.
 */
export function unjustifyContent(el: HTMLElement) {
  // Find and remove all elements inserted by `justifyContent`.
  const tagged = getTaggedChildren(el);
  for (let node of tagged) {
    const parent = node.parentNode!;
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      parent.insertBefore(child, node);
    });
    parent.removeChild(node);
  }

  // Re-join text nodes that were split by `justifyContent`.
  el.normalize();
}

/**
 * Justify an existing paragraph.
 *
 * Justify the contents of `elements`, using `hyphenateFn` to apply hyphenation if
 * necessary.
 *
 * To justify multiple paragraphs, it is more efficient to call `justifyContent`
 * once with all the elements to be processed, than to call `justifyContent`
 * separately for each element. Passing a list allows `justifyContent` to
 * optimize DOM manipulations.
 */
export function justifyContent(
  elements: HTMLElement | HTMLElement[],
  // /** Todo: Merge with options... */
  // hyphenateFn?: (word: string) => string[],
  options: HelperOptions = {},
  debug = false,
) {
  if (!Array.isArray(elements)) {
    elements = [elements];
  }
  options = { ...options, isHTML: true };

  // Undo the changes made by any previous justification of this content.
  elements.forEach((el) => unjustifyContent(el));

  // Calculate line-break positions given current element width and content.
  const measureFn = new DOMTextMeasurer().measure;

  /** TODO!!!! ÉG TÓK ÞETTA TIL BAKA, VERÐUR AÐ ENDURSKOÐA!!!! */
  // To avoid layout thrashing, we batch DOM layout reads and writes in this
  // function. ie. we first measure the available width and compute linebreaks
  // for all elements and then afterwards modify all the elements.

  elements.forEach((el) => {
    const lineWidth = elementLineWidth(el);
    // console.log({ lineWidth });
    let items: DOMItem[] = [];
    addItemsForNode(items, el, { ...options, measureFn });

    // Disable automatic line wrap.
    el.style.whiteSpace = 'nowrap';

    const lines = new TexLinebreak<DOMItem>({
      ...options,
      // Todo: do sth about adjacent glues ...
      items,
      lineWidth,
      isHTML: true,
    }).lines;

    console.log(items);

    // Create a `Range` for each line. We create the ranges before modifying the
    // contents so that node offsets in `items` are still valid at the point when
    // we create the Range.
    const lineRanges: Range[] = [];
    lines.forEach((line, i) => {
      const range = document.createRange();
      if (i > 0) {
        range.setStart(line.prevBreakItem.parentDOMNode, line.prevBreakItem.endOffset);
      } else {
        range.setStart(el, 0);
      }
      range.setEnd(line.breakItem.parentDOMNode, line.breakItem.startOffset);
      lineRanges.push(range);
    });

    // Insert linebreak. The browser will automatically adjust subsequent
    // ranges. This must be done before the next step.
    lines.forEach((line, i) => {
      const range = lineRanges[i];

      if (i > 0) {
        const brEl = tagNode(document.createElement('br'));
        range.insertNode(brEl);
        range.setStart(brEl.nextSibling!, 0);
      }
    });

    lines.forEach((line, i) => {
      const range = lineRanges[i];

      const wrappedNodes = addWordSpacingToLine(range, line);
      if (line.endsWithSoftHyphen && wrappedNodes.length > 0) {
        const lastNode = wrappedNodes[wrappedNodes.length - 1];
        const hyphen = tagNode(document.createTextNode('-'));
        lastNode.parentNode!.appendChild(hyphen);
      }
    });

    if (debug) debugLines(lines, el);
  });
}

/** Draw boxes on screen to see any possible mismatches in size calculations */
export const debugLines = (lines: Line[], appendToElement: HTMLElement) => {
  const box1 = tagNode(document.createElement('div'));
  box1.style.position = 'relative';
  box1.style.height = lines.length * 15 + 'px';
  console.log({ lines });

  lines.forEach((line) => {
    let yOffset = line.lineNumber * 15;
    line.positionedItems.forEach((item) => {
      let xOffset = item.xOffset;
      const box = document.createElement('div');
      box.style.position = 'absolute';
      box.style.left = xOffset + 'px';
      box.style.top = yOffset + 'px';
      box.style.height = '10px';
      box.style.width = item.width + 'px';
      box.style.background = '#7272ed80';
      box.style.font = '9px sans-serif';
      // @ts-ignore
      box.innerHTML = item.text || '?';
      box1.appendChild(box);
    });
  });
  appendToElement.appendChild(box1);
};
