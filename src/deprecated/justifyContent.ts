import { visualizeBoxesForDebugging } from 'src/html/debugging';
import DOMTextMeasurer from 'src/html/domTextMeasurer';
import { DOMItem, getItemsFromDOM } from 'src/html/getItemsFromDOM';
import { getFloatingElements } from 'src/html/htmlUtils';
import { getRangeOfItem, texLinebreakDOM, resetDOMJustification } from 'src/html';
import { getElementLineWidth } from 'src/html/lineWidth';
import { tagNode } from 'src/html/tagNode';
import { TexLinebreak } from 'src/index';
import { getOptionsWithDefaults, TexLinebreakOptions } from 'src/options';
import { SOFT_HYPHEN } from 'src/splitTextIntoItems/splitTextIntoItems';

/**
 * Justify HTML elements.
 *
 * @deprecated
 * @param elements - Can be a query selector string or a list of elements.
 */
export function justifyContent(
  elements: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  hyphenateFn?: (word: string) => string[],
) {
  texLinebreakDOM(elements, { hyphenateFn });
}
