import { TexLinebreakOptions } from "../options";

/**
 * Todo: limit to possible overlaps (i.e.
 * ignore those off x-axis and above element
 *
 * Note: Ignores all floating elements that are children of absolute and sticky containers!
 */
export function getFloatingElements(
  options: TexLinebreakOptions
): HTMLElement[] {
  if (options.ignoreFloatingElements) return [];
  let floating: HTMLElement[] = [];
  Array.from(
    document.querySelectorAll<HTMLElement>("body *:not(span,script,b,i,br)")
  ).forEach((element) => {
    const { float } = window.getComputedStyle(element);
    if (float === "left" || float === "right")
      if (
        !ignoreForFloatingElements(element) &&
        !findParentMatching(element, ignoreForFloatingElements)
      ) {
        floating.push(element);
      }
  });
  return floating;
}

/**
 * A check done for floating elements and all of its parents
 */
function ignoreForFloatingElements(e: HTMLElement): boolean {
  const { position, display } = window.getComputedStyle(e);
  return position === "absolute" || position === "sticky" || display === "none";
}

function findParentMatching(
  element: HTMLElement,
  predicate: (element: HTMLElement) => boolean
): HTMLElement | null {
  let parent = element.parentElement;
  while (parent) {
    if (predicate(parent)) {
      console.warn("FOUND!");
      return parent;
    }
    parent = parent.parentElement;
  }
  return null;
}
