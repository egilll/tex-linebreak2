import DOMTextMeasurer from 'src/util/dom-text-measurer';
import {
  getTaggedChildren,
  elementLineWidth,
  DOMItem,
  addItemsForNode,
  tagNode,
  addWordSpacing,
} from 'src/html/html';
import { TexLinebreak } from 'src/helpers';
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
  /** Todo: Merge with options... */
  hyphenateFn?: (word: string) => string[],
  options: HelperOptions = {},
) {
  if (!Array.isArray(elements)) {
    elements = [elements];
  }

  // Undo the changes made by any previous justification of this content.
  elements.forEach((el) => unjustifyContent(el));

  // Calculate line-break positions given current element width and content.
  const measure = new DOMTextMeasurer().measure;

  /** TODO!!!! ÉG TÓK ÞETTA TIL BAKA, VERÐUR AÐ ENDURSKOÐA!!!! */
  // To avoid layout thrashing, we batch DOM layout reads and writes in this
  // function. ie. we first measure the available width and compute linebreaks
  // for all elements and then afterwards modify all the elements.

  elements.forEach((el) => {
    const lineWidth = elementLineWidth(el);
    let items: DOMItem[] = [];
    addItemsForNode(items, el, measure, hyphenateFn, true, options);

    // Disable automatic line wrap.
    el.style.whiteSpace = 'nowrap';

    const lines = new TexLinebreak<DOMItem>({
      ...options,
      items,
      lineWidth,
      ignoreNewlines: true,
    }).getLines();

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
      // If this is the final line and the natural spacing between words does
      // not need to be compressed, then don't try to expand the spacing to fill
      // the line.
      const isFinalLine = i === lineRanges.length - 1;
      if (isFinalLine && line.extraSpacePerGlue >= 0) {
        return;
      }

      const wrappedNodes = addWordSpacing(range, line);
      if (line.endsWithSoftHyphen && wrappedNodes.length > 0) {
        const lastNode = wrappedNodes[wrappedNodes.length - 1];
        const hyphen = tagNode(document.createTextNode('-'));
        lastNode.parentNode!.appendChild(hyphen);
      }
    });
  });
}
