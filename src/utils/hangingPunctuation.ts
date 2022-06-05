import { TexLinebreakOptions } from 'src/options';
import { box, glue, isSoftHyphen, TextItem } from 'src/utils/utils';

/**
 * Here we calculate the width of the hanging punctuation of this item,
 * which will be used if the item is at the beginning or end of a line.
 */
export const addHangingPunctuation = (
  items: TextItem[],
  options: TexLinebreakOptions,
): TextItem[] => {
  let output: TextItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item.type !== 'box' ||
      !('text' in item) ||
      item.width === 0 ||
      isSoftHyphen(items[i + 1])
    ) {
      output.push(item);
      continue;
    }

    /** Left hanging punctuation */
    if (
      item.text &&
      hangingPunctuationRegex.test(item.text.slice(0, 1)) &&
      // If the character is repeated ("...", "??"), we don't hang
      item.text.slice(0, 1) !== item.text.slice(1, 2)
    ) {
      const leftHangingPunctuationWidth = item.width - options.measureFn(item.text.slice(1));

      output.push(glue(leftHangingPunctuationWidth, 0, 0));
      output.push(box(-leftHangingPunctuationWidth));
    }

    /* TEMP test */
    // output.push(box(-30));

    output.push(item);

    /** Right hanging punctuation */
    if (
      item.text &&
      hangingPunctuationRegex.test(item.text.slice(-1)) &&
      item.text.slice(-1) !== item.text.slice(-2, -1)
    ) {
      const rightHangingPunctuationWidth = item.width - options.measureFn(item.text.slice(0, -1));
      item.width -= rightHangingPunctuationWidth;
      output.push(glue(rightHangingPunctuationWidth, 0, 0));
    }
  }

  return output;
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
