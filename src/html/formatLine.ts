import { Line } from 'src/helpers';
import { tagNode } from 'src/html/tagNode';

/** Wrap text nodes in a range and adjust the inter-word spacing. */
export function formatLine(range: Range, glueRangesInLine: Range[], line: Line) {
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
}
