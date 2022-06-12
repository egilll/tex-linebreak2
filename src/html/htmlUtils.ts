/**
 * Todo: limit to possible overlaps (i.e.
 * ignore those off x-axis and above element
 */
export function getFloatingElements(): HTMLElement[] {
  let floating: HTMLElement[] = [];
  Array.from(
    document.querySelectorAll<HTMLElement>("body *:not(span,script,b,i,br)")
  ).forEach((element) => {
    const { float } = window.getComputedStyle(element);
    if (float === "left" || float === "right") {
      floating.push(element);
    }
  });
  return floating;
}
