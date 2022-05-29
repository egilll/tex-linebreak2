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

  // console.log(elements);

  const domTextMeasureFn = new DOMTextMeasurer().measure;
  const floatingElements = getFloatingElements();

  elements.forEach((element) => {
    // Undo the changes made by any previous justification of this content.
    unjustifyContent(element);

    try {
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

      lines.forEach((line, i) => {
        let glueRangesInLine: Range[] = [];
        line.itemsFiltered.forEach((item) => {
          if (item.type === 'glue') {
            const range = document.createRange();
            range.setStart(item.startContainer, item.startOffset);
            range.setEnd(item.endContainer, item.endOffset);
            glueRangesInLine.push(range);
          }
        });

        const firstBox = line.itemsFiltered[0];
        const range2 = document.createRange();
        range2.setEnd(firstBox.endContainer, firstBox.endOffset);
        range2.setStart(firstBox.startContainer, firstBox.startOffset);

        setTimeout(() => {
          glueRangesInLine.forEach((glueRange) => {
            const contents = glueRange.toString();
            const span = tagNode(document.createElement('span'));
            span.style.width = `${line.glueWidth}px`;
            span.style.display = 'inline-block';

            glueRange.deleteContents();
            glueRange.insertNode(span);
            span.innerHTML = contents;

            span.style.background = 'blue';
            span.style.height = '10px';
          });

          if (line.lineIndex > 0) {
            range2.insertNode(tagNode(document.createElement('br')));
          }
          if (line.leftHangingPunctuationWidth) {
            const span = tagNode(document.createElement('span'));
            span.style.marginLeft = `-${line.leftHangingPunctuationWidth}px`;
            range2.insertNode(span);
          }
        }, 0);

        // if (line.endsWithSoftHyphen && wrappedNodes.length > 0) {
        //   const lastNode = wrappedNodes[wrappedNodes.length - 1];
        //   const hyphen = tagNode(document.createTextNode('-'));
        //   lastNode.parentNode!.appendChild(hyphen);
        // }
      });

      if (debug) debugHtmlLines(lines, element);
    } catch (e) {
      /**
       * In the case of an error, we undo any changes we may have
       * made so that the user isn't left with a broken document.
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
