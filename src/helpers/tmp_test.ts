import LineBreaker, { Break } from 'linebreak';
import {
  UnicodeLineBreakingClasses,
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
} from 'src/typings/unicodeLineBreakingClasses';
import { MIN_COST, MAX_COST } from 'src/breakLines';
import { TextInputItem, penalty, glue, box } from 'src/helpers/util';
import { HelperOptions } from 'src/helpers/options';

const NON_BREAKING_SPACE = '\xa0';
const SOFT_HYPHEN = '\u00AD';

export enum PenaltyClasses {
  MandatoryBreak = MIN_COST,
  /** Spaces */
  VeryGoodBreak = 0,
  GoodBreak = 100,
  OKBreak = 200,
  BadBreak = 300,
  VeryBadBreak = 600,
}

export const getBreakablePoints = (input: string, options: HelperOptions): TextInputItem[] => {
  const lineBreaker = new LineBreaker(input);
  let breakPoints: Break[] = [];
  let b: Break;
  while ((b = lineBreaker.nextBreak())) breakPoints.push(b);

  const hyphenWidth = options.measureFn('-');
  let items: TextInputItem[] = [];

  for (let i = 0; i < breakPoints.length; i++) {
    const breakPoint = breakPoints[i];
    /**
     * The segment contains the word and the whitespace characters that come after it
     */
    const segment = input.slice(breakPoints[i - 1]?.position || 0, breakPoints[i].position);
    const isLastSegment = i === breakPoints.length - 1;

    let cost: number;

    /**
     * Todo:
     * "The recommendation in this case is for the layout system not to utilize a
     * line break opportunity allowed by SY unless the distance between it and
     * the next line break opportunity exceeds an implementation-defined minimal distance."
     */
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
      cost = PenaltyClasses.OKBreak;
    }

    // En-dashes and language-specific visible breaking characters
    else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
      cost = PenaltyClasses.OKBreak;
    }

    // Break-before class (rare)
    else if (nextLetterClass === UnicodeLineBreakingClasses.BreakBefore) {
      cost = PenaltyClasses.OKBreak;
    }

    // Soft hyphens
    else if (lastLetter === SOFT_HYPHEN) {
      cost = PenaltyClasses.BadBreak;
    }

    // Slashes
    else if (lastLetterClass === UnicodeLineBreakingClasses.SymbolAllowingBreakAfter) {
      cost = PenaltyClasses.VeryBadBreak;
    }

    // Other break-classes
    else {
      cost = PenaltyClasses.VeryBadBreak;
    }

    items.push(...splitIntoBoxesAndGlue(segment, options));

    /** Paragraph-final infinite glue */
    if (cost === PenaltyClasses.MandatoryBreak) {
      items.push(glue(0, 0, MAX_COST, ''));
    }

    /** Add penalty */
    if (lastLetter === SOFT_HYPHEN) {
      items.push(penalty(hyphenWidth, cost, true));
    } else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
      // Hyphens
      items.push(penalty(0, cost, true));
    } else {
      //todo ignore penalty for ending in glues
      items.push(penalty(0, cost));
    }
  }

  // for (let i = 0; i < input.length; i++) {
  //   getLineBreakingClassOfLetterAt(input, i); //?
  // }

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
export const splitIntoBoxesAndGlue = (input: string, options: HelperOptions): TextInputItem[] => {
  let items: TextInputItem[] = [];

  /**
   * Remove whitespace from end, we will add that back at the end
   */
  const m = input.match(/^(.+?)(\s+)$/);
  const inputWithoutFinalWhitespace = m?.[1] || input;
  const finalWhitespace = m?.[2] || null;

  // todo half-width space
  const spaceWidth = options.measureFn(' ');
  const spaceShrink = 0;
  const spaceStretch = spaceWidth * 1.5;

  const stretchableSpaces = new RegExp(
    `([ \\t\\p{General_Category=Zs}${NON_BREAKING_SPACE}]+)`,
    'gu',
  );
  const parts = inputWithoutFinalWhitespace.split(stretchableSpaces);
  parts.forEach((part, index) => {
    // Box
    if (index % 2 === 0) {
      items.push(box(options.measureFn(part), part));
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
