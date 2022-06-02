import { Items } from 'src/items';

/**
 * Here we calculate the width of the hanging punctuation of this item,
 * which will be used if the item is at the beginning or end of a line.
 *
 * Note: This value is not used in the {@link breakLines} calculation
 * currently, but it could be.
 *
 * The original Knuth paper recommended moving hanging punctuations to the
 * adjacent glues, but that does not work with left hanging punctuation.
 *
 * (Todo: Actually edits the input items directly, should either be
 * immutable or not return anything)
 */
export const addHangingPunctuation = (items: Items) => {
  items.forEach((item) => {
    if (!item.isBox || !item.text || item.width === 0 || item.next?.isSoftHyphen) return;

    /** Left hanging punctuation */
    if (
      hangingPunctuationRegex.test(item.text.slice(0, 1)) &&
      // If the character is repeated ("...", "??"), we don't hang
      item.text.slice(0, 1) !== item.text.slice(1, 2)
    ) {
      item.leftHangingPunctuationWidth = item.width - items.options.measureFn(item.text.slice(1));
    }

    /** Right hanging punctuation */
    if (
      hangingPunctuationRegex.test(item.text.slice(-1)) &&
      item.text.slice(-1) !== item.text.slice(-2, -1)
    ) {
      item.rightHangingPunctuationWidth =
        item.width - items.options.measureFn(item.text.slice(0, -1));
    }
  });
};

/**
 * The following punctuation items are not included, as it would not look good:
 *
 * - Slashes (/)
 * - Em and en dashes
 *
 * (`General_Category=Pi` are initial quotes, and `General_Category=Pf` are
 * final quotes)
 */
const hangingPunctuationRegex =
  /[.,;:!?\-()\[\]{}'"\p{General_Category=Pi}\p{General_Category=Pf}]/u;
