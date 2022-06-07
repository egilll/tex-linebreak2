import { MAX_COST, MIN_COST } from "src/breakLines";
import { TexLinebreakOptions } from "src/options";
import {
  BreakpointInformation,
  SOFT_HYPHEN,
} from "src/splitTextIntoItems/splitTextIntoItems";
import { UnicodeLineBreakingClasses } from "src/typings/unicodeLineBreakingClasses";

export enum PenaltyClasses {
  MandatoryBreak = MIN_COST,
  Space = 0,
  GoodBreak = 10,
  OKBreak = 20,
  /** @deprecated */
  SoftHyphen = PenaltyClasses.OKBreak,
  BadBreak = 50,
  VeryBadBreak = 900,
}

export const getBreakpointPenalty = (
  breakpoint: BreakpointInformation,
  options: TexLinebreakOptions
): number => {
  const { lastLetter, lastLetterClass, nextLetterClass } = breakpoint;

  if (breakpoint.required) {
    return PenaltyClasses.MandatoryBreak;
  }

  // Spaces
  else if (
    // Space
    lastLetterClass === UnicodeLineBreakingClasses.Space ||
    // Tab
    lastLetter === "\t" ||
    // Other breaking spaces
    (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter &&
      lastLetter.match(/\p{General_Category=Zs}/gu)) ||
    // Zero width space
    lastLetterClass === UnicodeLineBreakingClasses.ZeroWidthSpace
  ) {
    return PenaltyClasses.Space;
  } else if (options.onlyBreakOnWhitespace) {
    return MAX_COST;
  }

  // Em dash
  else if (
    lastLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide ||
    nextLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide
  ) {
    return PenaltyClasses.GoodBreak;
  }

  // Ideographic
  else if (lastLetterClass === UnicodeLineBreakingClasses.Ideographic) {
    return PenaltyClasses.GoodBreak;
  }

  // Hyphens
  else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
    return PenaltyClasses.GoodBreak;
  }

  // En-dashes and language-specific visible breaking characters
  else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
    return PenaltyClasses.GoodBreak;
  }

  // Soft hyphens
  else if (lastLetter === SOFT_HYPHEN) {
    /** (Note: Value actually not used, is overwritten in {@link softHyphen}) */
    return PenaltyClasses.SoftHyphen;
  }

  // Break-before class (rare)
  else if (nextLetterClass === UnicodeLineBreakingClasses.BreakBefore) {
    /**
     * TODO: Incomplete: Certain symbols in
     * this class cause a preceding soft hyphen
     */
    return PenaltyClasses.OKBreak;
  }

  // Slashes
  else if (
    lastLetterClass === UnicodeLineBreakingClasses.SymbolAllowingBreakAfter
  ) {
    /**
     * Todo:
     * "The recommendation in this case is for the layout system
     * not to utilize a line break opportunity allowed by SY unless
     * the distance between it and the next line break opportunity
     * exceeds an implementation-defined minimal distance."
     */
    return PenaltyClasses.VeryBadBreak;
  }

  // Other break-classes
  else {
    return PenaltyClasses.VeryBadBreak;
  }
};

export const penaltyLowerIfFarAwayFromBreakingPoint = () => {
  throw new Error("Not implemented");
};
