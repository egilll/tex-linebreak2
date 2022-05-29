import { TextInputItem, isSoftHyphen } from 'src/helpers/util';
import { TexLinebreakOptions } from 'src/helpers/options';

/**
 * The following punctuation items are not included, as it would not look good:
 *   - Dashes
 *   - Em hyphens
 *
 * `General_Category=Pi` are initial quotes
 * `General_Category=Pf` are final quotes
 */
const hangingPunctuationRegex =
  /[.,;:!?\-()\[\]{}'"\p{General_Category=Pi}\p{General_Category=Pf}]/u;

/**
 * Here we calculate the width of the hanging punctuation of this item,
 * which will be used if the item is at the beginning or end of a line.
 *
 * Note: This value is not used in the {@link breakLines} calculation
 * currently, but it could be.
 *
 * The original Knuth paper recommended moving hanging punctuations to the
 * adjacent glues, but that does not work with left hanging punctuation.
 */
export const calculateHangingPunctuationWidth = (
  items: TextInputItem[],
  options: TexLinebreakOptions,
): TextInputItem[] => {
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type !== 'box' || item.width <= 1 || isSoftHyphen(items[i + 1])) continue;

    /** Left hanging punctuation */
    if (
      hangingPunctuationRegex.test(item.text.slice(0, 1)) &&
      // Multiple punctuation marks will not be hanged
      !hangingPunctuationRegex.test(item.text.slice(1, 2))
    ) {
      item.leftHangingPunctuationWidth = item.width - options.measureFn!(item.text.slice(1));
    }

    /** Right hanging punctuation */
    if (
      hangingPunctuationRegex.test(item.text.slice(-1)) &&
      // Multiple punctuation marks will not be hanged
      !hangingPunctuationRegex.test(item.text.slice(-2, -1))
    ) {
      item.rightHangingPunctuationWidth = item.width - options.measureFn!(item.text.slice(0, -1));
    }
  }

  return items;
};
