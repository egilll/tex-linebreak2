import { getLineWidth } from 'src/breakLines';

export type LineWidth =
  | number
  | number[]
  | {
      defaultLineWidth: number;
      [lineIndex: number]: number;
    };
export function getElementLineWidth(
  element: HTMLElement,
  floatingElements?: HTMLElement[],
): LineWidth {
  let { width, boxSizing, paddingLeft, paddingRight, textIndent } = getComputedStyle(element);
  let defaultLineWidth: number | number[] = parseFloat(width!);
  if (boxSizing === 'border-box') {
    defaultLineWidth -= parseFloat(paddingLeft!);
    defaultLineWidth -= parseFloat(paddingRight!);
  }

  let lineWidths: LineWidth = { defaultLineWidth };

  const indentationOfFirstLine = parseInt(textIndent);
  if (indentationOfFirstLine) {
    lineWidths[0] = defaultLineWidth - indentationOfFirstLine;
  }

  if (floatingElements && floatingElements.length > 0) {
    const { lineHeight } = window.getComputedStyle(element);
    console.log(lineHeight);
    const elRect = element.getBoundingClientRect();
    let firstLine: number;
    let lineIndex = 0;
    floatingElements.forEach((floatingElement) => {
      const flRect = floatingElement.getBoundingClientRect();
      const { float } = window.getComputedStyle(element);
      let overlapWidth = 0;
      if (float === 'right') {
        overlapWidth = elRect.width - (flRect.left - elRect.left);
      } else if (float === 'left') {
        overlapWidth = elRect.width - (flRect.right - elRect.right);
      }

      console.log(getLineWidth(lineWidths, lineIndex));
      console.log(lineWidths[lineIndex]);
      firstLine =
        getLineWidth(lineWidths, lineIndex++) - (elRect.width - (flRect.left - elRect.left));
    });
    return firstLine!;
  }
  console.log(`
  ---------------
         ----------`);

  return lineWidths;
}

export function isTextOrInlineElement(node: Node) {
  if (node instanceof Text) {
    return true;
  } else if (node instanceof Element) {
    return getComputedStyle(node).display === 'inline';
  } else {
    return false;
  }
}
