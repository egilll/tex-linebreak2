import { visualizeBoxesForDebugging } from 'src/html/debugging';
import DOMTextMeasurer from 'src/html/domTextMeasurer';
import { DOMGlue, DOMItem, getItemsFromDOM } from 'src/html/getItemsFromDOM';
import { getFloatingElements } from 'src/html/htmlHelpers';
import { getElementLineWidth } from 'src/html/lineWidth';
import { getTaggedChildren, tagNode } from 'src/html/tagNode';
import { ItemPosition, TexLinebreak } from 'src/index';
import { getOptionsWithDefaults, TexLinebreakOptions } from 'src/options';

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
  elements: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  /** For backwards compatibility, this parameter also accepts a `hyphenateFn`. */
  _options: Partial<TexLinebreakOptions> | ((word: string) => string[]) = {},
  debug = false,
) {
  /**
   * Done for backwards compatibility: Previous versions
   * accepted a `hyphenateFn` as the second parameter.
   */
  if (typeof _options === 'function') {
    _options = { hyphenateFn: _options };
  }

  const options = getOptionsWithDefaults({ ..._options, collapseNewlines: true });

  if (!elements) {
    return console.error("justifyContent didn't receive any items");
  } else if (typeof elements === 'string') {
    elements = document.querySelectorAll(elements);
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
      const items = getItemsFromDOM(element, { ...options, lineWidth }, domTextMeasureFn);

      /** Disable automatic line wrap. */
      element.style.whiteSpace = 'nowrap';

      const lines = new TexLinebreak<DOMItem>(items, {
        ...options,
        lineWidth,
        collapseNewlines: true,
      }).lines;

      // console.log(items);

      /**
       * Since `Range`s are fragile and will easily go out of sync when we make
       * changes to the DOM, we go through the lines in a reverse order. We
       * also only alter one item at a time instead of wrapping the entire line.
       */
      lines
        .slice()
        .reverse()
        .forEach((line) => {
          const glues = line.positionedItems.filter((item) => item.type === 'glue') as (DOMGlue &
            ItemPosition)[];
          const glueRanges = glues.map(getRangeOfItem);
          const firstBoxRange = getRangeOfItem(line.itemsFiltered[0]);
          const finalBoxRange = getRangeOfItem(line.itemsFiltered.at(-1)!);

          glueRanges.forEach((glueRange, index) => {
            const glue = glues[index];
            const span = tagNode(document.createElement('span'));
            /**
             * A glue cannot be `inline-block` since that messes with the
             * formatting of links (each word gets its own underline)
             */
            span.style.wordSpacing = `${glue.adjustedWidth - glue.width}px`;
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

      if (debug) visualizeBoxesForDebugging(lines, element);
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

/** Reverse the changes made to an element by {@link justifyContent}. */
export function unjustifyContent(element: HTMLElement) {
  // Find and remove all elements inserted by `justifyContent`.
  const tagged = getTaggedChildren(element);
  for (let node of tagged) {
    const parent = node.parentNode!;
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      parent.insertBefore(child, node);
    });
    parent.removeChild(node);
  }

  // Re-join text nodes that were split by `justifyContent`.
  element.normalize();

  element.style.whiteSpace = 'initial';
}

export const getRangeOfItem = (item: DOMItem): Range => {
  const range = document.createRange();
  range.setStart(item.startContainer, item.startOffset);
  range.setEnd(item.endContainer, item.endOffset);
  return range;
};
