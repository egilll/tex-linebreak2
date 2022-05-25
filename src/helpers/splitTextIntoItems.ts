import LineBreaker, { Break } from 'linebreak';
import {
  UnicodeLineBreakingClasses,
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
} from 'src/typings/unicodeLineBreakingClasses';
import { MIN_COST, MAX_COST } from 'src/breakLines';
import { TextInputItem, penalty, glue, box } from 'src/helpers/util';
import { HelperOptions } from 'src/helpers/options';
import { TexLinebreak } from 'src/helpers/index';

const NON_BREAKING_SPACE = '\xa0';
const SOFT_HYPHEN = '\u00AD';

export enum PenaltyClasses {
  MandatoryBreak = MIN_COST,
  VeryGoodBreak = 0, // Spaces
  GoodBreak = 10,
  OKBreak = 20,
  SoftHyphen = PenaltyClasses.OKBreak,
  BadBreak = 50,
  VeryBadBreak = 100,
}

export const splitTextIntoItems = (input: string, obj: TexLinebreak): TextInputItem[] => {
  const options = obj.options;
  const lineBreaker = new LineBreaker(input);
  let breakPoints: Break[] = [];
  let b: Break;
  while ((b = lineBreaker.nextBreak())) breakPoints.push(b);

  // TODO
  // if (options.hyphenateFn) {
  //   const chunks = options.hyphenateFn(part);
  //   chunks.forEach((c, i) => {
  //     items.push(box(options.measureFn!(c), c));
  //     if (i < chunks.length - 1) {
  //       items.push(softHyphen(options));
  //     }
  //   });
  // }

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

    if (breakPoint.required || isLastSegment) {
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
      lastLetterClass === UnicodeLineBreakingClasses.ZeroWidthSpace
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
    if (cost === PenaltyClasses.MandatoryBreak) {
      items.push(glue(0, 0, MAX_COST, ''));
    }

    /**
     * Add the penalty for this break
     */
    if (lastLetter === SOFT_HYPHEN) {
      items.push(penalty(options.measureFn!('-'), PenaltyClasses.SoftHyphen, true));
    }
    // Hyphens
    else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
      items.push(penalty(0, cost, true));
    }
    // Penalty for other items (but ignoring zero-cost penalty after glue,
    // since glues already have a zero-cost penalty)
    // else if (!(items[items.length - 1].type === 'glue') && cost === 0) {
    else {
      items.push(penalty(0, cost));
    }
  }

  return items;
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
  options: Partial<HelperOptions>,
): TextInputItem[] => {
  let items: TextInputItem[] = [];

  /**
   * Remove whitespace from end, we will add that back at the end
   */
  const m = input.match(/^(.+?)(\s+)$/);
  const inputWithoutFinalWhitespace = m?.[1] || input;
  const finalWhitespace = m?.[2] || null;

  // todo half-width space
  const spaceWidth = options.measureFn!(' ');
  const spaceShrink = 0;
  const spaceStretch = spaceWidth * 0.01;

  const stretchableSpaces = new RegExp(
    `([ \\t\\p{General_Category=Zs}${NON_BREAKING_SPACE}]+)`,
    'gu',
  );
  const parts = inputWithoutFinalWhitespace.split(stretchableSpaces);
  parts.forEach((part, index) => {
    // Box
    if (index % 2 === 0) {
      items.push(box(options.measureFn!(part), part));
    }
    // Stretchable glue inside the segment.
    // Can only be non-breakable glue.
    else {
      items.push(glue(spaceWidth, spaceShrink, spaceStretch, part));
      items.push(penalty(0, MAX_COST));
    }
  });

  /**
   * The above glues were non-breakable. Here we add the final breakable glue back.
   */
  if (finalWhitespace) {
    items.push(glue(spaceWidth, spaceShrink, spaceStretch, finalWhitespace));
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

// /**
//  * A convenience function that generates a set of input items for `breakLines`
//  * from a string.
//  */
// export function splitTextIntoItems(
//   input: string,
//   options: Partial<HelperOptions>,
// ): TextInputItem[] {
//   let items: TextInputItem[] = [];
//
//   /**
//    * Split into 1. words (including their following punctuation) and 2. whitespace
//    */
//   const chunks = input
//     /* Collapse spaces */
//     .replace(/ +/g, ' ')
//     /* Collapse spaces around newlines */
//     .replace(/ ?\n ?/g, '\n')
//     /* Split on spaces and newlines */
//     .split(/([ \n])/)
//     .filter((w) => w.length > 0);
//
//   chunks.forEach((chunk, index) => {
//     if (
//       chunk === '\n' &&
//       index > 0 &&
//       (options.keepNewlines || options.keepNewlinesAfter?.test(chunks[index - 1]))
//     ) {
//       /** Keep newline after punctuation */
//       items.push(...paragraphEnd());
//     } else if (
//       (chunk === ' ' || chunk === '\n') &&
//       !options.dontBreakOnSpacesMatching?.(chunks[index - 1], chunks[index + 1])
//     ) {
//       /** Space */
//       //TODO: Verify stretch values!
//       items.push(glue(1, 1, 1, ' '));
//     } else {
//       /** Word */
//       items.push(box(chunk.length, chunk));
//     }
//   });
//   items.push(...paragraphEnd());
//   return items;
// }

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
  return new TexLinebreak({ text: input, measureFn, hyphenateFn }).getItems();
}
