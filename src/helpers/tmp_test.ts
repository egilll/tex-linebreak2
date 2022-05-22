import LineBreaker, { Break } from 'linebreak';
import {
  UnicodeLineBreakingClasses,
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
} from 'src/typings/unicodeLineBreakingClasses';
import { MIN_COST } from 'src/breakLines';

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

// story.match(/\p{General_Category=Letter}/gu);

export const getBreakablePoints = (input: string) => {
  const lineBreaker = new LineBreaker(input);
  let breakPoints: Break[] = [];
  let b: Break;
  while ((b = lineBreaker.nextBreak())) breakPoints.push(b);

  for (let i = 0; i < breakPoints.length; i++) {
    const breakPoint = breakPoints[i];
    /**
     * This contains the final space character, if any.
     */
    const word = input.slice(breakPoints[i - 1]?.position || 0, breakPoints[i].position);
    const isLastSegment = i === breakPoints.length - 1;

    console.log('"' + word + '"');

    let penalty: number;
    let penaltyDependsOnDistanceToNextGoodBreakingPoint;

    const lastLetter = word.slice(-1);
    const lastLetterClass = getLineBreakingClassOfLetterAt(input, breakPoint.position - 1);
    const nextLetterClass = getLineBreakingClassOfLetterAt(input, breakPoint.position);

    lastLetterClass;

    if (breakPoint.required || isLastSegment) {
      penalty = PenaltyClasses.MandatoryBreak;
    }

    // Breaking spaces and tabs
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
      penalty = PenaltyClasses.VeryGoodBreak;
    }

    // Em dash
    else if (
      lastLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide ||
      nextLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide
    ) {
      penalty = PenaltyClasses.GoodBreak;
    }

    // Ideographic
    else if (lastLetterClass === UnicodeLineBreakingClasses.Ideographic) {
      penalty = PenaltyClasses.GoodBreak;
    }

    // Hyphens
    else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
      penalty = PenaltyClasses.OKBreak;
    }

    // En-dashes and language-specific visible breaking characters
    else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
      penalty = PenaltyClasses.OKBreak;
    }

    // Break-before class (rare)
    else if (nextLetterClass === UnicodeLineBreakingClasses.BreakBefore) {
      penalty = PenaltyClasses.OKBreak;
    }

    // Soft hyphens
    else if (lastLetter === SOFT_HYPHEN) {
      penalty = PenaltyClasses.BadBreak;
    }

    // Slashes
    else if (lastLetterClass === UnicodeLineBreakingClasses.SymbolAllowingBreakAfter) {
      penalty = PenaltyClasses.VeryBadBreak;
    }

    // Other break-classes
    else {
      penalty = PenaltyClasses.VeryBadBreak;
    }
  }

  /* tmp test */
  for (let i = 0; i < input.length; i++) {
    getLineBreakingClassOfLetterAt(input, i); //?
  }
};

export const penaltyLowerIfFarAwayFromBreakingPoint = () => {
  throw new Error('Not implemented');
};

/**
 * The word itself may still contain whitespace that should stretch,
 * e.g. non-breaking space or even a regular space such as in the case of
 * "a / b" in which the first space is not a breaking point according to
 * the output of our Unicode line-breaking package.
 */
export const extractGlueFromNonBreakablePoints = (input: string) => {};

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

getBreakablePoints('b–a');

/**
 * "The recommendation in this case is for the layout system not to utilize a
 * line break opportunity allowed by SY unless the distance between it and
 * the next line break opportunity exceeds an implementation-defined minimal distance."
 */
