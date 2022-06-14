import LineBreaker, { Break } from "linebreak";
import { MAX_COST, MIN_COST } from "src/breakLines";
import {
  getOptionsWithDefaults,
  RequireOnlyCertainKeys,
  TexLinebreakOptions,
} from "src/options";
import { getBreakpointPenalty } from "src/splitTextIntoItems/penalty";
import {
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
  UnicodeLineBreakingClasses,
} from "src/typings/unicodeLineBreakingClasses";
import { forciblySplitLongWords } from "src/utils/forciblySplitLongWords";
import { addHangingPunctuation } from "src/utils/hangingPunctuation";
import {
  forcedBreak,
  glue,
  penalty,
  softHyphen,
  textBox,
  textGlue,
  TextItem,
} from "src/utils/items";
import { infiniteGlue } from "src/utils/utils";

export const NON_BREAKING_SPACE = "\u00A0";
export const SOFT_HYPHEN = "\u00AD";

/**
 * Characters that can stretch as glue, no matter whether
 * they are actually breakpoints or not.
 * `General_Category=Zs` are space separators, including NBSP
 */
const glueCharacterRegex = /[ \t\p{General_Category=Zs}\n\r]/u;

type Segment = {
  text: string;
  type: "box" | "glue";
  breakpoint?: BreakpointInformation;
};
export type BreakpointInformation = {
  required: boolean;
  lastLetter: string;
  lastLetterClass: UnicodeLineBreakingClasses;
  nextLetterClass: UnicodeLineBreakingClasses;
  position: number;
};

export function splitTextIntoItems(
  input: string,
  _options: RequireOnlyCertainKeys<TexLinebreakOptions, "measureFn">,
  /**
   * When splitting text inside HTML elements,
   * the text that surrounds it matters
   */
  precedingText: string = "",
  followingText: string = ""
): TextItem[] {
  const options = getOptionsWithDefaults(_options);

  let items: TextItem[] = [];

  precedingText = precedingText.slice(-50);
  followingText = followingText.slice(0, 50);
  const inputWithSurroundingText = precedingText + input + followingText;
  const breakpoints: Record<number, BreakpointInformation> =
    getAllowableUnicodeBreakpoints(inputWithSurroundingText);

  /** Relative to inputWithSurroundingText */
  let disallowedBreakpoints: number[] = [
    ...getIndicesMatching(
      inputWithSurroundingText,
      options.neverBreakInside,
      "inside"
    ),
    ...getIndicesMatching(
      inputWithSurroundingText,
      options.neverBreakAfter,
      "after"
    ),
  ];

  /**
   * We start by splitting the input into segments of either boxes (text) or
   * glue (stretchable spaces) which each may or may not end in a breakpoint.
   *
   * We go over each character in the input one by one.
   *
   * The reason for this is that the input may contain many spaces such as
   * non-breaking spaces and spaces before slashes, which are not breakpoints
   * but which have to stretch as glue. Pre-processing these segments in this
   * manner makes the next step more manageable.
   */
  let segments: Segment[] = [];
  for (let charIndex = 0; charIndex < input.length; charIndex++) {
    const char = input[charIndex];
    const indexInInputWithSurroundingText = precedingText.length + charIndex;
    let breakpoint: BreakpointInformation | null =
      breakpoints[indexInInputWithSurroundingText + 1] || null;
    if (disallowedBreakpoints.includes(indexInInputWithSurroundingText)) {
      breakpoint = null;
    }

    /** TODO: Special handling of newlines? */

    const isGlue = glueCharacterRegex.test(char);
    let type: Segment["type"] = isGlue ? "glue" : "box";

    if (
      segments.length === 0 ||
      segments.at(-1)!.type !== type ||
      (segments.at(-1)!.type === "box" && segments.at(-1)!.breakpoint) ||
      (segments.at(-1)!.type === "glue" &&
        segments.at(-1)!.breakpoint?.required)
    ) {
      segments.push({ text: "", type });
    }
    segments.at(-1)!.text += char;

    if (breakpoint) {
      /**
       * The breakpoint library we're using will always mark
       * the end of a string as a breakpoint. Here we check
       * if it is actually something we need to break after.
       */
      if (
        charIndex === input.length - 1 &&
        !(isGlue || breakpoint.required) &&
        !options.addParagraphEnd
      ) {
        continue;
      }

      /**
       * Treat newline as just a space character in HTML.
       * Todo: Should perhaps be done elsewhere
       */
      if (options.collapseAllNewlines && breakpoint.required) {
        breakpoint.required = false;
        breakpoint.lastLetterClass = UnicodeLineBreakingClasses.Space;
      }

      segments.at(-1)!.breakpoint = breakpoint;
    }
  }

  segments.forEach((segment, index) => {
    const isLastSegment = index === segments.length - 1;
    let cost =
      segment.breakpoint && getBreakpointPenalty(segment.breakpoint, options);
    if (options.addParagraphEnd && isLastSegment) cost = MIN_COST;

    const isParagraphEnd =
      cost === MIN_COST || (options.addParagraphEnd && isLastSegment);

    /** First we add the box. */
    if (segment.type === "box") {
      items.push(...textBox(segment.text, options));
    }

    /**
     * This array will hold the glue. We do this in order to be able to choose
     * whether to then add more items before the glue or after the glue.
     */
    let remainingItems: TextItem[] = [];

    if (segment.type === "glue") {
      /**
       * Non-breaking spaces and normal spaces that
       * cannot be broken, e.g. spaces before slashes.
       */
      if (!segment.breakpoint) {
        remainingItems.push(penalty(0, MAX_COST));
      }
      if (!isParagraphEnd) {
        /** Add a space */
        remainingItems.push(...textGlue(segment.text, options));
      } else {
        /**
         * If this is the paragraph end, then the text of this glue
         * is not important. We do however record it in a zero-width
         * glue just so that we have a record of the text.
         */
        remainingItems.push(glue(0, 0, 0, segment.text));
      }
    }

    if (segment.breakpoint) {
      /** Paragraph end */
      if (isParagraphEnd) {
        if (options.addInfiniteGlueToFinalLine) {
          remainingItems.push(infiniteGlue());
        }
        remainingItems.push(forcedBreak());
      } else {
        /** Soft hyphens. */
        if (segment.breakpoint?.lastLetter === SOFT_HYPHEN) {
          remainingItems.push(...softHyphen(options));
        } else if (
          /**
           * Ignore zero-cost penalty before glue, since
           * glues already have a zero-cost penalty
           */
          !(remainingItems.at(-1)?.type === "glue" && cost === 0)
        ) {
          /** The penalty for this break. */
          remainingItems.unshift(penalty(0, cost!));
        }
      }
    }
    items.push(...remainingItems);
  });

  if (options.hangingPunctuation) {
    items = addHangingPunctuation(items, options /* followingText*/);
  }

  if (options.forceOverflowToBreak) {
    items = forciblySplitLongWords(items, options);
  }

  return items;
}

/**
 * A helper function around the {@link LineBreaker} module.
 * Returns breakpoints and their Unicode breakpoint letter classification.
 */
export function getAllowableUnicodeBreakpoints(
  input: string
): Record<number, BreakpointInformation> {
  const lineBreaker = new LineBreaker(input);
  let currentBreak: Break;
  let positionToBreakpointInformation: Record<number, BreakpointInformation> =
    {};
  while ((currentBreak = lineBreaker.nextBreak())) {
    const lastLetterClass = getUnicodeLineBreakingClassOfLetterAt(
      input,
      currentBreak.position - 1
    );
    const nextLetterClass = getUnicodeLineBreakingClassOfLetterAt(
      input,
      currentBreak.position
    );
    positionToBreakpointInformation[currentBreak.position] = {
      position: currentBreak.position,
      required: currentBreak.required,
      lastLetter: input.slice(currentBreak.position - 1, currentBreak.position),
      lastLetterClass,
      nextLetterClass,
    };
  }
  return positionToBreakpointInformation;
}

/**
 * Input should be the full string and not a substring – it has to
 * include the surrounding characters to get an accurate classification.
 */
export function getUnicodeLineBreakingClassOfLetterAt(
  input: string,
  position: number
): UnicodeLineBreakingClasses {
  const j = new LineBreaker(input);
  j.pos = position;
  return convertEnumValuesOfLineBreakingPackageToUnicodeNames[
    j.nextCharClass() as keyof typeof convertEnumValuesOfLineBreakingPackageToUnicodeNames
  ] as UnicodeLineBreakingClasses;
}

/**
 * Extracts indices from the options
 * {@link TexLinebreakOptions#neverBreakInside} and similar
 */
export function getIndicesMatching(
  input: string,
  pattern: (string | RegExp) | (string | RegExp)[] | undefined,
  type: "inside" | "after"
): number[] {
  if (Array.isArray(pattern)) {
    return pattern.map((p) => getIndicesMatching(input, p, type)).flat();
  } else if (pattern instanceof RegExp) {
    let output: number[] = [];
    let match;
    while ((match = pattern.exec(input)) !== null) {
      addToOutput(output, match.index, match[0].length);
    }
    return output;
  } else if (typeof pattern === "string") {
    let output: number[] = [];
    let i = -1;
    while ((i = input.indexOf(pattern, i + 1)) !== -1) {
      addToOutput(output, i, pattern.length);
    }
    return output;
  } else if (pattern === undefined) {
    return [];
  } else {
    throw new Error("Invalid pattern type, got " + typeof pattern);
  }

  function addToOutput(arr: number[], startIndex: number, endIndex: number) {
    if (type === "inside") {
      for (let i = startIndex + 1; i < endIndex; i++) {
        arr.push(i);
      }
    } else if (type === "after") {
      arr.push(endIndex);
    }
  }
}
