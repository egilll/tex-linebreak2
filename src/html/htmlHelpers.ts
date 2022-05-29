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

  let lineWidths: {
    defaultLineWidth: number;
    [lineIndex: number]: number;
  } = { defaultLineWidth };

  const indentationOfFirstLine = parseInt(textIndent);
  if (indentationOfFirstLine) {
    lineWidths[0] = defaultLineWidth - indentationOfFirstLine;
  }

  if (floatingElements && floatingElements.length > 0) {
    const lineHeight = parseFloat(window.getComputedStyle(element).lineHeight);
    // const lineHeight = 20;
    const paragraphRect = element.getBoundingClientRect();
    let firstLine: number;
    floatingElements.forEach((floatingElement) => {
      const floatingElementRect = floatingElement.getBoundingClientRect();
      const floatingElementStyle = window.getComputedStyle(floatingElement);
      let xAxisOverlap = 0;
      if (floatingElementStyle.float === 'right') {
        xAxisOverlap =
          paragraphRect.width -
          (floatingElementRect.left -
            parseFloat(floatingElementStyle.marginLeft) -
            paragraphRect.left);
      } else if (floatingElementStyle.float === 'left') {
        xAxisOverlap =
          paragraphRect.width -
          (floatingElementRect.right +
            parseFloat(floatingElementStyle.marginRight) -
            paragraphRect.right);
      }

      const firstLineThatOverlaps = Math.floor(
        (floatingElementRect.top - parseFloat(floatingElementStyle.marginTop) - paragraphRect.top) /
          lineHeight,
      );
      const lastLineThatOverlaps = Math.floor(
        (floatingElementRect.bottom +
          parseFloat(floatingElementStyle.marginBottom) -
          paragraphRect.top) /
          lineHeight,
      );
      if (lastLineThatOverlaps < 0) return;
      for (let lineIndex = firstLineThatOverlaps; lineIndex <= lastLineThatOverlaps; lineIndex++) {
        if (lineIndex < 0) continue;
        lineWidths[lineIndex] = getLineWidth(lineWidths, lineIndex) - xAxisOverlap;
      }
    });
  }

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
