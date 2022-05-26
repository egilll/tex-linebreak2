import LineBreaker, { Break } from 'linebreak';
import {
  UnicodeLineBreakingClasses,
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
} from 'src/typings/unicodeLineBreakingClasses';
import { MIN_COST, MAX_COST } from 'src/breakLines';
import {
  TextInputItem,
  penalty,
  glue,
  softHyphen,
  TextGlue,
  textBox,
  textGlue,
  collapseAdjacentSpaces,
} from 'src/helpers/util';
import { HelperOptions, getOptionsWithDefaults } from 'src/helpers/options';
import { TexLinebreak } from 'src/helpers/index';
import { calculateHangingPunctuationWidth } from 'src/helpers/hangingPunctuations';

const NON_BREAKING_SPACE = '\xa0';
const SOFT_HYPHEN = '\u00AD';

export enum PenaltyClasses {
  MandatoryBreak = MIN_COST,
  VeryGoodBreak = 0, // Spaces
  GoodBreak = 10,
  OKBreak = 20,
  SoftHyphen = PenaltyClasses.OKBreak,
  BadBreak = 50,
  VeryBadBreak = 0,
}

export const splitTextIntoItems = (input: string, _options: HelperOptions): TextInputItem[] => {
  const options = getOptionsWithDefaults(_options);

  /**
   * Allowable breakpoints according to Unicode's line breaking algorithm.
   */
  const lineBreaker = new LineBreaker(input);
  let breakPoints: Break[] = [];
  let b: Break;
  while ((b = lineBreaker.nextBreak())) breakPoints.push(b);

  let items: TextInputItem[] = [];

  for (let i = 0; i < breakPoints.length; i++) {
    const breakPoint = breakPoints[i];
    /**
     * The segment contains the word and the whitespace characters that come after it
     */
    const segment = input.slice(breakPoints[i - 1]?.position || 0, breakPoints[i].position);

    const isLastSegment = i === breakPoints.length - 1;

    let cost: number;

    let penaltyDependsOnDistanceToNextGoodBreakingPoint;

    const lastLetter = segment.slice(-1);
    const lastLetterClass = getLineBreakingClassOfLetterAt(input, breakPoint.position - 1);
    const nextLetterClass = getLineBreakingClassOfLetterAt(input, breakPoint.position);

    if (
      breakPoint.required &&
      !(
        // TODO: This option is used when breaking HTML. HTML ignores newlines, but it should not ignore <br>
        (options.isHTML && lastLetter === '\n')
      )
    ) {
      cost = PenaltyClasses.MandatoryBreak;
    }

    // Spaces
    else if (
      // Space
      lastLetterClass === UnicodeLineBreakingClasses.Space ||
      // Tab
      lastLetter === '\t' ||
      // Other breaking spaces
      (UnicodeLineBreakingClasses.BreakAfter && lastLetter.match(/\p{General_Category=Zs}/gu)) ||
      // Zero width space
      lastLetterClass === UnicodeLineBreakingClasses.ZeroWidthSpace ||
      breakPoint.required
    ) {
      cost = PenaltyClasses.VeryGoodBreak;
    }

    // Em dash
    else if (
      lastLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide ||
      nextLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide
    ) {
      cost = PenaltyClasses.GoodBreak;
    }

    // Ideographic
    else if (lastLetterClass === UnicodeLineBreakingClasses.Ideographic) {
      cost = PenaltyClasses.GoodBreak;
    }

    // Hyphens
    else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
      cost = PenaltyClasses.GoodBreak;
    }

    // En-dashes and language-specific visible breaking characters
    else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
      cost = PenaltyClasses.GoodBreak;
    }

    // Soft hyphens
    else if (lastLetter === SOFT_HYPHEN) {
      /** (Note: Value actually not used, is overwritten in {@link softHyphen}) */
      cost = PenaltyClasses.SoftHyphen;
    }

    // Break-before class (rare)
    else if (nextLetterClass === UnicodeLineBreakingClasses.BreakBefore) {
      /** TODO: Incomplete: Certain symbols in this class cause a preceding soft hyphen */
      cost = PenaltyClasses.OKBreak;
    }

    // Slashes
    else if (lastLetterClass === UnicodeLineBreakingClasses.SymbolAllowingBreakAfter) {
      /**
       * Todo:
       * "The recommendation in this case is for the layout system not to utilize a
       * line break opportunity allowed by SY unless the distance between it and
       * the next line break opportunity exceeds an implementation-defined minimal distance."
       */
      cost = PenaltyClasses.VeryBadBreak;
    }

    // Other break-classes
    else {
      cost = PenaltyClasses.VeryBadBreak;
    }

    items.push(...splitSegmentIntoBoxesAndGlue(segment, options));

    /** Paragraph-final infinite glue */
    if (cost === PenaltyClasses.MandatoryBreak || (options.addParagraphEnd && isLastSegment)) {
      if (items[items.length - 1].type === 'glue') {
        /** If the last character in the segment was a newline character, we convert it into a stretchy glue */
        items[items.length - 1] = {
          ...items[items.length - 1],
          shrink: 0,
          stretch: MAX_COST,
          width: 0,
        } as TextGlue;
      } else {
        items.push(glue(0, 0, MAX_COST, ''));
      }
    }

    /**
     * Add the penalty for this break
     */
    if (lastLetter === SOFT_HYPHEN) {
      items.push(softHyphen(options));
    }
    // Hyphens
    else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
      /** Todo: Should regular hyphens not be flagged? */
      items.push(penalty(0, cost, false));
      // items.push(penalty(0, cost, true));
    }
    // Penalty for other items (but ignoring zero-cost penalty after glue,
    // since glues already have a zero-cost penalty)
    else if (!(items[items.length - 1].type === 'glue' && cost === 0) && cost != null) {
      items.push(penalty(0, cost));
    }
  }

  if (options.hangingPunctuation) {
    items = calculateHangingPunctuationWidth(items, options);
  }

  return collapseAdjacentSpaces(items);
};

export const penaltyLowerIfFarAwayFromBreakingPoint = () => {
  throw new Error('Not implemented');
};

/**
 * Split the segments between the breakpoints into boxes and glue.
 *
 * A space is included in the segment preceding it.
 * The segment may also include other spaces, such as:
 *   - a non-breaking space character
 *   - regular space that is prohibited from breaking, such as in the case of
 *     "a / b" in which the first space cannot break since it is followed by a slash.
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
   * The above glues were non-breakable. Here we add the final breakable glue back.
   */
  if (finalWhitespace) {
    items.push(textGlue(finalWhitespace, options));
  }
  return items;
};

/**
 * @param input - Must be the full original string in order to classify based on the surrounding characters
 * @param position
 */
export const getLineBreakingClassOfLetterAt = (
  input: string,
  position: number,
): UnicodeLineBreakingClasses => {
  const j = new LineBreaker(input);
  j.pos = position;
  return convertEnumValuesOfLineBreakingPackageToUnicodeNames[
    j.nextCharClass() as keyof typeof convertEnumValuesOfLineBreakingPackageToUnicodeNames
  ] as UnicodeLineBreakingClasses;
};

/**
 * @deprecated
 *   This function is deprecated due to the name being confusing,
 *   but it is kept for backwards compatibility.
 *   Please use {@link splitTextIntoItems} instead.
 *
 * A convenience function that generates a set of input items for `breakLines`
 * from a string.
 *
 * @param input - Text to process
 * @param measureFn - Callback that calculates the width of a given string
 * @param hyphenateFn - Callback that calculates legal hyphenation points in
 *                      words and returns an array of pieces that can be joined
 *                      with hyphens.
 */
export function layoutItemsFromString(
  input: string,
  measureFn: (word: string) => number,
  hyphenateFn?: (word: string) => string[],
): TextInputItem[] {
  return new TexLinebreak({ text: input, measureFn, hyphenateFn }).getItems() as TextInputItem[];
}
