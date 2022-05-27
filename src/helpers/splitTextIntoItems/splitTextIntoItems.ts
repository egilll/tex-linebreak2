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
  collapseAdjacentGlue,
} from 'src/helpers/util';
import { HelperOptions, getOptionsWithDefaults } from 'src/helpers/options';
import { calculateHangingPunctuationWidth } from 'src/helpers/hangingPunctuations';
import { splitSegmentIntoBoxesAndGlue } from 'src/helpers/splitTextIntoItems/splitSegmentIntoBoxesAndGlue';

export const NON_BREAKING_SPACE = '\xa0';
export const SOFT_HYPHEN = '\u00AD';

export enum PenaltyClasses {
  MandatoryBreak = MIN_COST,
  VeryGoodBreak = 0, // Spaces
  GoodBreak = 10,
  OKBreak = 20,
  SoftHyphen = PenaltyClasses.OKBreak,
  BadBreak = 50,
  VeryBadBreak = 0,
}

const FAKE_FINAL_SEGMENT = 'FAKE_FINAL_SEGMENT\n';

export const splitTextIntoItems = (
  input: string,
  _options: HelperOptions,
  /** When splitting text inside HTML elements, the text that surrounds it matters */
  precedingText: string = '',
  followingText: string = '',
): TextInputItem[] => {
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

    let isRequiredBreak = breakPoint.required;
    let isActuallyNotABreak;
    if (
      isLastSegment &&
      breakPoint.required &&
      ![
        UnicodeLineBreakingClasses.BreakMandatory,
        UnicodeLineBreakingClasses.CarriageReturn,
        UnicodeLineBreakingClasses.LineFeed,
        UnicodeLineBreakingClasses.NextLine,
      ].includes(lastLetterClass)
    ) {
      isRequiredBreak = false;
      isActuallyNotABreak = true;
    }

    /**
     * Note: The last segment is always marked as a required break in the Unicode line breaking package.
     */
    if (
      isRequiredBreak &&
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
      isRequiredBreak
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

    // todo.....
    if (isActuallyNotABreak && cost === PenaltyClasses.VeryBadBreak && !options.addParagraphEnd) {
      continue;
    }

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
    // Soft hyphens
    if (lastLetter === SOFT_HYPHEN) {
      items.push(softHyphen(options));
    }
    // Hyphens
    else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
      /** Todo: Should regular hyphens not be flagged? */
      items.push(penalty(0, cost, false));
      // items.push(penalty(0, cost, true));
    }
    // Penalty for other items
    else {
      /**
       * Ignore zero-cost penalty after glue, since glues already have a zero-cost penalty
       */
      if (items[items.length - 1].type === 'glue' && cost === 0 && cost != null) continue;
      // todo
      if (options.addParagraphEnd && isLastSegment) {
        cost = MIN_COST;
      }
      items.push(penalty(0, cost));
    }
  }

  if (options.hangingPunctuation) {
    items = calculateHangingPunctuationWidth(items, options);
  }

  console.log({ items, input });

  return collapseAdjacentGlue(items);
};

export const penaltyLowerIfFarAwayFromBreakingPoint = () => {
  throw new Error('Not implemented');
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
