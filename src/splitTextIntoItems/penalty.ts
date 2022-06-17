import { MAX_COST, MIN_COST } from "src/breakLines";
import { TexLinebreakOptions } from "src/options";
import {
  BreakpointInformation,
  SOFT_HYPHEN,
} from "src/splitTextIntoItems/splitTextIntoItems";
import { UnicodeLineBreakingClasses } from "src/typings/unicodeLineBreakingClasses";

export function getBreakpointPenalty(
  breakpoint: BreakpointInformation,
  options: TexLinebreakOptions
): number {
  const { lastLetter, lastLetterClass, nextLetterClass } = breakpoint;

  if (breakpoint.required) {
    return MIN_COST;
  }

  // Spaces
  else if (
    [
      UnicodeLineBreakingClasses.Space,
      UnicodeLineBreakingClasses.ZeroWidthSpace,
      UnicodeLineBreakingClasses.CarriageReturn,
      UnicodeLineBreakingClasses.LineFeed,
      UnicodeLineBreakingClasses.NextLine,
      UnicodeLineBreakingClasses.BreakMandatory,
    ].includes(lastLetterClass) ||
    // Tab
    lastLetter === "\t" ||
    // Other breaking spaces
    (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter &&
      lastLetter.match(/\p{General_Category=Zs}/gu)) ||
    nextLetterClass === null
  ) {
    return 0;
  }

  // If the option `onlyBreakOnWhitespace` is on,
  // everything that is not a space has a MAX_COST penalty.
  else if (options.onlyBreakOnWhitespace) {
    return MAX_COST;
  }

  // Em dash
  else if (
    lastLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide ||
    nextLetterClass === UnicodeLineBreakingClasses.BreakOnEitherSide
  ) {
    /** Todo: Check how this behaves when space is followed by em-dash */
    return 5;
  }

  // Hyphens
  else if (lastLetterClass === UnicodeLineBreakingClasses.Hyphen) {
    return options.regularHyphenPenalty;
  }

  // En-dashes and language-specific visible breaking characters
  else if (lastLetterClass === UnicodeLineBreakingClasses.BreakAfter) {
    return 10;
  }

  // Soft hyphens
  else if (lastLetter === SOFT_HYPHEN) {
    /** (Note: Value actually not used, is overwritten in {@link softHyphen}) */
    return options.softHyphenPenalty;
  }

  // Break-before class (rare)
  else if (nextLetterClass === UnicodeLineBreakingClasses.BreakBefore) {
    /**
     * Todo: Incomplete: Certain symbols in
     * this class cause a preceding soft hyphen
     */
    return 10;
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
    return 900;
  }

  // Ideographic
  else if (lastLetterClass === UnicodeLineBreakingClasses.Ideographic) {
    return 100;
  }

  // Other break-classes, such as punctuation followed by opening brackets.
  else {
    // if (process.env.NODE_ENV === "development") {
    //   console.warn(`Unknown other break-class: `, breakpoint);
    // }
    return 900;
  }
}

export const penaltyLowerIfFarAwayFromBreakingPoint = () => {
  throw new Error("Not implemented");
};
