import DOMTextMeasurer from 'src/util/domTextMeasurer';
import { getFloatingElements } from 'src/html/htmlHelpers';
import { TexLinebreak } from 'src/helpers';
import { TexLinebreakOptions } from 'src/helpers/options';
import { DOMItem, GetItemsFromDOM } from 'src/html/getItemsFromDOM';
import { getTaggedChildren, tagNode } from 'src/html/tagNode';
import { debugHtmlLines } from 'src/util/debugHtmlLines';
import { getElementLineWidth } from 'src/html/lineWidth';

/**
 * Justify an existing paragraph.
 *
 * Justify the contents of `elements`, using `hyphenateFn` to apply
 * hyphenation if necessary.
 *
 * To justify multiple paragraphs, it is more efficient to call
 * `justifyContent` once with all the elements to be processed, than
 * to call `justifyContent` separately for each element. Passing a
 * list allows `justifyContent` to optimize DOM manipulations.
 */
export function justifyContent(
  elements: HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  /** For backwards compatibility, this parameter also accepts a `hyphenateFn`. */
  _options: TexLinebreakOptions | ((word: string) => string[]) = {},
  debug = false,
) {
  /**
   * Done for backwards compatibility:
   * Previous versions accepted a `hyphenateFn` as the second parameter.
   */
  if (typeof _options === 'function') {
    _options = { hyphenateFn: _options };
  }

  const options: TexLinebreakOptions = { ..._options, isHTML: true };

  if (!elements) {
    return console.error("justifyContent didn't receive any items");
  } else if (elements instanceof NodeList) {
    elements = Array.from(elements);
  } else if (!Array.isArray(elements)) {
    elements = [elements];
  }

  const domTextMeasureFn = new DOMTextMeasurer().measure;
  const floatingElements = getFloatingElements();

  elements.forEach((element) => {
    /** Undo the changes made by any previous justification of this content. */
    unjustifyContent(element);
    try {
      const lineWidth = getElementLineWidth(element, floatingElements);
      const items = new GetItemsFromDOM(element, options, domTextMeasureFn).items;

      /** Disable automatic line wrap. */
      element.style.whiteSpace = 'nowrap';

      const lines = new TexLinebreak<DOMItem>({
        ...options,
        items,
        lineWidth,
        isHTML: true,
      }).lines;

      // console.log(items);

      let ranges: Array<{
        glueRanges: Range[];
        firstBoxRange: Range;
        finalBoxRange: Range;
      }> = [];

      /** We have to calculate all of the ranges before making any changes */
      lines.forEach((line) => {
        ranges.push({
          glueRanges: line.itemsFiltered.filter((item) => item.type === 'glue').map(getRangeOfItem),
          firstBoxRange: getRangeOfItem(line.itemsFiltered[0]),
          finalBoxRange: getRangeOfItem(line.itemsFiltered.at(-1)),
        });
      });

      /**
       * Now the ranges have been calculated and we can alter the DOM.
       * This system is however not very robust, the addition of the soft
       * hyphens messes up our ranges, so we go through the ranges backwards so
       * the ranges we're working on won't have shifted by previous changes.
       */
      lines
        .slice()
        .reverse()
        .forEach((line, i) => {
          const { glueRanges, firstBoxRange, finalBoxRange } = ranges[lines.length - 1 - i];

          /** Give all glue items a fixed width */
          glueRanges.forEach((glueRange) => {
            const span = tagNode(document.createElement('span'));
            span.style.width = `${line.glueWidth}px`;
            span.style.display = 'inline-block';
            // glueRange.deleteContents();
            // glueRange.insertNode(span);
            glueRange.surroundContents(span);
          });

          /** Insert <br/> elements to separate the lines */
          if (line.lineIndex > 0) {
            firstBoxRange.insertNode(tagNode(document.createElement('br')));
          }

          /**
           * Hanging punctuation is added by inserting
           * an empty span with a negative margin
           */
          if (line.leftHangingPunctuationWidth) {
            const span = tagNode(document.createElement('span'));
            span.style.marginLeft = `-${line.leftHangingPunctuationWidth}px`;
            firstBoxRange.insertNode(span);
          }

          /** Add soft hyphens */
          if (line.endsWithSoftHyphen) {
            const span = tagNode(document.createElement('span'));
            finalBoxRange.surroundContents(span);
            span.appendChild(tagNode(document.createTextNode('-')));
          }
        });

      if (debug) debugHtmlLines(lines, element);
    } catch (e) {
      /**
       * In the case of an error, we undo any changes we may have
       * made so that the user isn't left with a broken document.
       * (Todo: Test if this actually works)
       */
      console.error(e);
      unjustifyContent(element);
    }
  });
}

/** Reverse the changes made to an element by `justifyContent`. */
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

export const getRangeOfItem = (item: DOMItem): Range => {
  const range = document.createRange();
  range.setStart(item.startContainer, item.startOffset);
  range.setEnd(item.endContainer, item.endOffset);
  return range;
};
