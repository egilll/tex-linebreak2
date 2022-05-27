import { HelperOptions } from 'src/helpers/options';
import { TextInputItem, textBox, softHyphen, textGlue, penalty } from 'src/helpers/util';
import { MAX_COST } from 'src/breakLines';
import { NON_BREAKING_SPACE } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';

/**
 * Split the segments between the breakpoints into boxes and glue.
 *
 * A space is included in the segment preceding it.
 * The segment may also include other spaces, such as:
 *   - a non-breaking space character
 *   - regular space that is prohibited from breaking, such as in the case of
 *     "a / b" in which the first space cannot break since it is followed by a
 * slash.
 */
export const splitSegmentIntoBoxesAndGlue = (
  input: string,
  options: HelperOptions,
): TextInputItem[] => {
  let items: TextInputItem[] = [];

  /**
   * Remove whitespace from end, we will add that back at the end
   */
  const m = input.match(/^((?:.+?)?\S)?(\s+)?$/);
  const inputWithoutFinalWhitespace = m?.[1] || '';
  const finalWhitespace = m?.[2] || null;

  const stretchableSpaces = new RegExp(
    `([ \\t\\p{General_Category=Zs}${NON_BREAKING_SPACE}]+)`,
    'gu',
  );
  const parts = inputWithoutFinalWhitespace.split(stretchableSpaces);
  parts.forEach((part, index) => {
    // Box
    if (index % 2 === 0) {
      if (part.length === 0) return;
      /** Todo: move elsewhere, too costly to do this here */
      if (options.hyphenateFn) {
        const chunks = options.hyphenateFn(part);
        chunks.forEach((c, i) => {
          items.push(textBox(c, options));
          if (i < chunks.length - 1) {
            items.push(softHyphen(options));
          }
        });
      } else {
        items.push(textBox(part, options));
      }
    }
    // Stretchable glue inside the segment.
    // Can only be non-breakable glue.
    else {
      items.push(textGlue(part, options));
      items.push(penalty(0, MAX_COST));
    }
  });

  /**
   * The above glues were non-breakable. Here we add the final breakable glue
   * back.
   */
  if (finalWhitespace) {
    items.push(textGlue(finalWhitespace, options));
  }
  return items;
};
