export function isTextOrInlineElement(node: Node) {
  if (node instanceof Text) {
    return true;
  } else if (node instanceof Element) {
    return getComputedStyle(node).display === 'inline';
  } else {
    return false;
  }
}

/**
 * todo: limit to possible overlaps (i.e. ignore those off x-axis and above
 * element
 */
export const getFloatingElements = (): HTMLElement[] => {
  let floating: HTMLElement[] = [];
  Array.from(document.querySelectorAll<HTMLElement>('body *:not(span,script,b,i,br)')).forEach(
    (element) => {
      const { float } = window.getComputedStyle(element);
      if (float === 'left' || float === 'right') {
        floating.push(element);
      }
    },
  );
  return floating;
};
