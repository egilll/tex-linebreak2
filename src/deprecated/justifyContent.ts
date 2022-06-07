import { texLinebreakDOM } from "src/html/texLinebreakDOM";

/**
 * Justify HTML elements.
 *
 * @deprecated
 * @param elements - Can be a query selector string or a list of elements.
 */
export function justifyContent(
  elements: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  hyphenateFn?: (word: string) => string[]
) {
  texLinebreakDOM(elements, { hyphenateFn });
}
