import DOMTextMeasurer from 'src/util/domTextMeasurer';
import { getFloatingElements } from 'src/html/htmlHelpers';
import { TexLinebreak } from 'src/helpers';
import { HelperOptions } from 'src/helpers/options';
import { DOMItem, GetItemsFromDOM } from 'src/html/getItemsFromDOM';
import { getTaggedChildren, tagNode } from 'src/html/tagNode';
import { debugHtmlLines } from 'src/util/debugHtmlLines';
import { formatLine } from 'src/html/formatLine';
import { getElementLineWidth } from 'src/html/lineWidth';

/**
 * Justify an existing paragraph.
 *
 * Justify the contents of `elements`, using `hyphenateFn` to apply hyphenation
 * if necessary.
 *
 * To justify multiple paragraphs, it is more efficient to call
 * `justifyContent`
 * once with all the elements to be processed, than to call `justifyContent`
 * separately for each element. Passing a list allows `justifyContent` to
 * optimize DOM manipulations.
 */
export function justifyContent(
  elements: HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  /** For backwards compatibility, this parameter also accepts a `hyphenateFn`. */
  _options: HelperOptions | ((word: string) => string[]) = {},
  debug = false,
) {
  /**
   * Done for backwards compatibility:
   * Previous versions accepted a `hyphenateFn` as the second parameter.
   */
  if (typeof _options === 'function') {
    _options = { hyphenateFn: _options };
  }

  const options: HelperOptions = { ..._options, isHTML: true };

  if (!elements) {
    return console.error("justifyContent didn't receive any items");
  } else if (elements instanceof NodeList) {
    elements = Array.from(elements);
  } else if (!Array.isArray(elements)) {
    elements = [elements];
  }

  // console.log(elements);

  const domTextMeasureFn = new DOMTextMeasurer().measure;
  const floatingElements = getFloatingElements();

  elements.forEach((element) => {
    // Undo the changes made by any previous justification of this content.
    unjustifyContent(element);

    const lineWidth = getElementLineWidth(element, floatingElements);

    // let items: DOMItem[] = [];
    // addItemsForNode(items, element, { ...options, measureFn });

    const items = new GetItemsFromDOM(element, options, domTextMeasureFn).items;

    // Disable automatic line wrap.
    element.style.whiteSpace = 'nowrap';

    const lines = new TexLinebreak<DOMItem>({
      ...options,
      // Todo: do sth about adjacent glues ...
      items,
      lineWidth,
      isHTML: true,
    }).lines;

    // console.log(element.textContent);

    console.log(items);
    // Create a `Range` for each line. We create the ranges before modifying the
    // contents so that node offsets in `items` are still valid at the point when
    // we create the Range.
    const lineRanges: Range[] = [];
    lines.forEach((line, i) => {
      const range = document.createRange();
      if (i > 0) {
        range.setStart(line.prevBreakItem.parentNode, line.prevBreakItem.endOffset);
      } else {
        range.setStart(element, 0);
      }
      range.setEnd(line.breakItem.parentNode, line.breakItem.startOffset);
      lineRanges.push(range);
    });

    /**
     * Insert linebreak. The browser will automatically adjust subsequent
     * ranges. This must be done before the next step.
     *
     * TODO: THIS DOES NOT HANDLE INLINE BLOCK ELEMENTS CORRECTLY
     * INLINE-BLOCK ELEMENTS CANNOT HAVE A BREAK INSIDE, THE BROWSER WILL
     * IGNORE IT
     */
    lines.forEach((line, i) => {
      const range = lineRanges[i];

      if (i > 0) {
        const brEl = tagNode(document.createElement('br'));
        range.insertNode(brEl);
        if (brEl.nextSibling) {
          range.setStart(brEl.nextSibling, 0);
        } else {
          /** Is an inline-block element of some sort... */
          range.setStart(brEl.parentElement!.nextSibling!, 0);
          console.warn('Unexpected: <br/> cannot be in an inline block element!');
        }
      }
    });

    lines.forEach((line, i) => {
      const range = lineRanges[i];

      const wrappedNodes = formatLine(range, line);
      if (line.endsWithSoftHyphen && wrappedNodes.length > 0) {
        const lastNode = wrappedNodes[wrappedNodes.length - 1];
        const hyphen = tagNode(document.createTextNode('-'));
        lastNode.parentNode!.appendChild(hyphen);
      }
    });

    if (debug) debugHtmlLines(lines, element);
  });
}

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
