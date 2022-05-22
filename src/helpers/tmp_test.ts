import LineBreaker, { Break } from 'linebreak';
import {
  UnicodeLineBreakingClasses,
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
} from 'src/typings/unicodeLineBreakingClasses';

const NON_BREAKING_SPACE = '\xa0';
const SOFT_HYPHEN = '\u00AD';

export enum PenaltyClasses {
  MandatoryBreak,
  GoodBreak,
  OKBreak,
  BadBreak,
  VeryBadBreak,
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
    let word = input.slice(breakPoints[i - 1]?.position || 0, breakPoints[i].position);

    console.log('"' + word + '"');

    let penaltyClass: PenaltyClasses;
    let penaltyDependsOnDistanceToNextGoodBreakingPoint;

    const lastLetter = word.slice(-1);
    const lastLetterClass = getLineBreakingClassOfLetterAt(input, breakPoint.position - 1);

    lastLetterClass;

    if (breakPoint.required) {
      penaltyClass = PenaltyClasses.MandatoryBreak;
    }

    // Breaking spaces and tabs
    else if (
      lastLetterClass === UnicodeLineBreakingClasses.Space ||
      (UnicodeLineBreakingClasses.BreakAfter &&
        (lastLetter === '\t' || lastLetter.match(/\p{General_Category=Zs}/gu)))
    ) {
      penaltyClass = PenaltyClasses.GoodBreak;
    }

    // Soft hyphens
    else if (lastLetter === SOFT_HYPHEN) {
      penaltyClass = PenaltyClasses.BadBreak;
    }

    //
    else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
      penalty = 0;
    } else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
      penalty = 0;
    }

    // const nextLetterClass = getLineBreakingClassOfLetterAt(input, breakPoint.position);
    // nextLetterClass;
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

getBreakablePoints('b-1a');

/**
 * "The recommendation in this case is for the layout system not to utilize a
 * line break opportunity allowed by SY unless the distance between it and
 * the next line break opportunity exceeds an implementation-defined minimal distance."
 */
