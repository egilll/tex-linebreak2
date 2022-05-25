import DOMTextMeasurer from 'src/util/dom-text-measurer';
import { breakLines, MaxAdjustmentExceededError } from 'src/breakLines';
import {
  taggedChildren,
  ElementBreakpoints,
  elementLineWidth,
  DOMItem,
  addItemsForNode,
  lineWidthsAndGlueCounts,
  tagNode,
  addWordSpacing,
} from 'src/html/html';

/**
 * Reverse the changes made to an element by `justifyContent`.
 */
export function unjustifyContent(el: HTMLElement) {
  // Find and remove all elements inserted by `justifyContent`.
  const tagged = taggedChildren(el);
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
  hyphenateFn?: (word: string) => string[],
) {
  // To avoid layout thrashing, we batch DOM layout reads and writes in this
  // function. ie. we first measure the available width and compute linebreaks
  // for all elements and then afterwards modify all the elements.

  if (!Array.isArray(elements)) {
    elements = [elements];
  }

  // Undo the changes made by any previous justification of this content.
  elements.forEach((el) => {
    unjustifyContent(el);
  });

  // Calculate line-break positions given current element width and content.
  const measurer = new DOMTextMeasurer();
  const measure = measurer.measure; //.bind(measurer);

  const elementBreaks: ElementBreakpoints[] = [];
  elements.forEach((el) => {
    const lineWidth = elementLineWidth(el);
    let items: DOMItem[] = [];
    addItemsForNode(items, el, measure);
    let breakpoints;
    try {
      // First try without hyphenation but a maximum stretch-factor for each
      // space.
      breakpoints = breakLines(items, lineWidth, {
        maxAdjustmentRatio: 2.0,
      });
    } catch (e) {
      if (e instanceof MaxAdjustmentExceededError) {
        // Retry with hyphenation and unlimited stretching of each space.
        items = [];
        addItemsForNode(items, el, measure, hyphenateFn);
        breakpoints = breakLines(items, lineWidth);
      } else {
        throw e;
      }
    }
    elementBreaks.push({ el, items, breakpoints, lineWidth });
  });

  // Insert line-breaks and adjust inter-word spacing.
  elementBreaks.forEach(({ el, items, breakpoints, lineWidth }) => {
    const [actualWidths, glueCounts] = lineWidthsAndGlueCounts(items, breakpoints);

    // Create a `Range` for each line. We create the ranges before modifying the
    // contents so that node offsets in `items` are still valid at the point when
    // we create the Range.
    const endsWithHyphen: boolean[] = [];
    const lineRanges: Range[] = [];
    for (let b = 1; b < breakpoints.length; b++) {
      const prevBreakItem = items[breakpoints[b - 1]];
      const breakItem = items[breakpoints[b]];

      const r = document.createRange();
      if (b > 1) {
        r.setStart(prevBreakItem.node, prevBreakItem.end);
      } else {
        r.setStart(el, 0);
      }
      r.setEnd(breakItem.node, breakItem.start);
      lineRanges.push(r);
      endsWithHyphen.push(breakItem.type === 'penalty' && breakItem.flagged);
    }

    // Disable automatic line wrap.
    el.style.whiteSpace = 'nowrap';

    // Insert linebreaks.
    lineRanges.forEach((r, i) => {
      if (i === 0) {
        return;
      }
      const brEl = document.createElement('br');
      tagNode(brEl);

      // Insert linebreak. The browser will automatically adjust subsequent
      // ranges.
      r.insertNode(brEl);

      r.setStart(brEl.nextSibling!, 0);
    });

    // Adjust inter-word spacing on each line and add hyphenation if needed.
    lineRanges.forEach((r, i) => {
      const spaceDiff = lineWidth - actualWidths[i];
      const extraSpacePerGlue = spaceDiff / glueCounts[i];

      // If this is the final line and the natural spacing between words does
      // not need to be compressed, then don't try to expand the spacing to fill
      // the line.
      const isFinalLine = i === lineRanges.length - 1;
      if (isFinalLine && extraSpacePerGlue >= 0) {
        return;
      }

      const wrappedNodes = addWordSpacing(r, extraSpacePerGlue);
      if (endsWithHyphen[i] && wrappedNodes.length > 0) {
        const lastNode = wrappedNodes[wrappedNodes.length - 1];
        const hyphen = document.createTextNode('-');
        tagNode(hyphen);
        lastNode.parentNode!.appendChild(hyphen);
      }
    });
  });
}
