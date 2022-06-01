import { getLineWidth, LineWidth, LineWidthObject } from 'src/utils';

export function getElementLineWidth(
  paragraphElement: HTMLElement,
  floatingElements?: HTMLElement[],
): LineWidth {
  let { width, boxSizing, paddingLeft, paddingRight, textIndent } =
    getComputedStyle(paragraphElement);
  let defaultLineWidth: number | number[] = parseFloat(width!);
  if (boxSizing === 'border-box') {
    defaultLineWidth -= parseFloat(paddingLeft!);
    defaultLineWidth -= parseFloat(paddingRight!);
  }

  let lineWidths: LineWidthObject = { defaultLineWidth };

  const indentationOfFirstLine = parseInt(textIndent);
  if (indentationOfFirstLine) {
    lineWidths[0] = defaultLineWidth - indentationOfFirstLine;
  }

  if (floatingElements && floatingElements.length > 0) {
    const lineHeight = parseFloat(window.getComputedStyle(paragraphElement).lineHeight);
    const paragraphRect = paragraphElement.getBoundingClientRect();
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
