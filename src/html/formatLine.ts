import { Line } from 'src/helpers';
import { textNodesInRange } from 'src/util/range';
import { tagNode } from 'src/html/tagNode';
import { isTextOrInlineElement } from 'src/html/htmlHelpers';

/**
 * Wrap text nodes in a range and adjust the inter-word spacing.
 */
export function formatLine(range: Range, line: Line): Text[] {
  /**
   * Collect all text nodes in range, skipping any non-inline elements and
   * their children because those are treated as opaque blocks by the line-
   * breaking step.
   */
  const texts: Text[] = textNodesInRange(range, isTextOrInlineElement);

  let hasSeenText = false;

  texts.forEach((t, elementInLineIndex) => {
    const wrapper = tagNode(document.createElement('span'));
    if (elementInLineIndex === 0 && line.leftHangingPunctuationWidth) {
      wrapper.style.marginLeft = `-${line.leftHangingPunctuationWidth}px`;
    }
    t.parentNode!.replaceChild(wrapper, t);

    /**
     * Absolute spacing of spaces
     */
    const text = t.textContent;
    const output = document.createDocumentFragment();
    text?.split(/(\s+)/g).forEach((part, partIndex, arr) => {
      if (partIndex % 2 == 0) {
        output.appendChild(document.createTextNode(part));
        hasSeenText = hasSeenText || Boolean(part);
      } else {
        const span = tagNode(document.createElement('span'));
        span.innerHTML = part;
        /** Todo: Absolute hack. Needs to actually match up with the glues instead!! */
        if (!hasSeenText) {
          span.style.width = `0px`;
        } else {
          span.style.width = `${line.glueWidth}px`;
        }
        span.style.display = 'inline-block';
        output.appendChild(span);
      }
    });

    // wrapper.appendChild(t);

    wrapper.appendChild(output);
  });

  return texts;
}
