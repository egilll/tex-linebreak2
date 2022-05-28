export function getElementLineWidth(element: HTMLElement): number | number[] {
  let { width, boxSizing, paddingLeft, paddingRight, textIndent } = getComputedStyle(element);
  let _width = parseFloat(width!);
  if (boxSizing === 'border-box') {
    _width -= parseFloat(paddingLeft!);
    _width -= parseFloat(paddingRight!);
  }

  const indentationOfFirstLine = parseInt(textIndent);
  if (indentationOfFirstLine) {
    /**
     * Here we return an array of line lengths consisting of the first line
     * and the second line widths. {@link getLineWidth} uses the last width
     * for all lines that follow it.
     */
    return [_width - indentationOfFirstLine, _width];
  }

  return _width;
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
