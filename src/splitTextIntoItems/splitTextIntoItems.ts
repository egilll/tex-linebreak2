import LineBreaker, { Break } from 'linebreak';
import { INFINITE_STRETCH, MAX_COST, MIN_COST } from 'src/breakLines/breakLines';
import { addHangingPunctuation } from 'src/hangingPunctuation';
import { Items2 } from 'src/items';
import { getOptionsWithDefaults, TexLinebreakOptions } from 'src/options';
import { getBreakpointPenalty, PenaltyClasses } from 'src/splitTextIntoItems/penalty';
import {
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
  UnicodeLineBreakingClasses,
} from 'src/typings/unicodeLineBreakingClasses';
import {
  forciblySplitLongWords,
  glue,
  penalty,
  softHyphen,
  textBox,
  textGlue,
  TextItem,
} from 'src/utils';

export const NON_BREAKING_SPACE = '\u00A0';
export const SOFT_HYPHEN = '\u00AD';

/**
 * Characters that can stretch as glue, no matter
 * whether they are actually breakpoints or not.
 * `General_Category=Zs` are space separators
 */
const glueCharacterRegex = new RegExp(`[ \\t\\p{General_Category=Zs}${NON_BREAKING_SPACE}]`, 'u');

export type Segment = {
  text: string;
  type: 'box' | 'glue';
  breakpoint?: BreakpointInformation;
};
export type BreakpointInformation = {
  required: boolean;
  lastLetter: string;
  lastLetterClass: UnicodeLineBreakingClasses;
  nextLetterClass: UnicodeLineBreakingClasses;
  position: number;
};

export const splitTextIntoItems = (
  input: string,
  options: TexLinebreakOptions,
  /**
   * When splitting text inside HTML elements,
   * the text that surrounds it matters
   */
  precedingText: string = '',
  followingText: string = '',
): TextItem[] => {
  options = getOptionsWithDefaults(options);

  let items = new Items2(options);

  precedingText = precedingText.slice(-3);
  followingText = followingText.slice(0, 3);
  const inputWithSurroundingText = precedingText + input + followingText;
  const breakpoints: Record<number, BreakpointInformation> =
    getBreakpoints(inputWithSurroundingText);

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
    const breakpoint: BreakpointInformation | undefined =
      breakpoints[indexInInputWithSurroundingText + 1];
    /** Newline characters are just glue in HTML */
    const isGlue =
      glueCharacterRegex.test(char) || (options.collapseNewlines && breakpoint?.required);
    let type: Segment['type'] = isGlue ? 'glue' : 'box';

    if (
      segments.length === 0 ||
      segments.at(-1)!.type !== type ||
      (segments.at(-1)!.type === 'box' && segments.at(-1)!.breakpoint) ||
      (segments.at(-1)!.type === 'glue' && segments.at(-1)!.breakpoint?.required)
    ) {
      segments.push({ text: '', type });
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
      if (options.collapseNewlines && breakpoint.required) {
        breakpoint.required = false;
        breakpoint.lastLetterClass = UnicodeLineBreakingClasses.Space;
      }

      segments.at(-1)!.breakpoint = breakpoint;
    }
  }

  segments.forEach((segment, index) => {
    if (segment.type === 'glue') {
      items.add(textGlue(segment.text, options));
      /**
       * Non-breaking spaces and normal spaces that
       * cannot be broken, e.g. spaces before slashes.
       */
      if (!segment.breakpoint) {
        items.add(penalty(0, MAX_COST));
      }
    } else if (segment.type === 'box') {
      items.add(textBox(segment.text, options));
    }

    if (segment.breakpoint) {
      /** Soft hyphens */
      if (segment.breakpoint?.lastLetter === SOFT_HYPHEN) {
        items.add(softHyphen(options));
        return;
      }

      const isLastSegment = index === segments.length - 1;
      let cost = getBreakpointPenalty(segment.breakpoint, options);
      if (options.addParagraphEnd && isLastSegment) cost = MIN_COST;

      /** Paragraph-final infinite glue */
      if (cost === PenaltyClasses.MandatoryBreak || (options.addParagraphEnd && isLastSegment)) {
        items.add(glue(0, 0, INFINITE_STRETCH, ''));
      }

      /**
       * Ignore zero-cost penalty after glue, since
       * glues already have a zero-cost penalty
       */
      if (items.at(-1)!.type === 'glue' && cost === 0 && cost != null) {
        return;
      }

      /** Add the penalty for this break. */
      items.add(penalty(0, cost));
    }
  });

  if (options.hangingPunctuation) {
    items = addHangingPunctuation(items, options);
  }

  if (options.forceOverflowToBreak) {
    items = forciblySplitLongWords(items, options);
  }

  return items;
};

/**
 * A helper function around the {@link LineBreaker} module.
 * Returns breakpoints and their Unicode breakpoint letter classification.
 */
export const getBreakpoints = (input: string): Record<number, BreakpointInformation> => {
  const lineBreaker = new LineBreaker(input);
  let currentBreak: Break;
  let positionToBreakpointInformation: Record<number, BreakpointInformation> = {};
  while ((currentBreak = lineBreaker.nextBreak())) {
    const lastLetterClass = getLineBreakingClassOfLetterAt(input, currentBreak.position - 1);
    const nextLetterClass = getLineBreakingClassOfLetterAt(input, currentBreak.position);
    positionToBreakpointInformation[currentBreak.position] = {
      position: currentBreak.position,
      required: currentBreak.required,
      lastLetter: input.slice(currentBreak.position - 1, currentBreak.position),
      lastLetterClass,
      nextLetterClass,
    };
  }
  return positionToBreakpointInformation;
};

/**
 * Input should be the full string and not a substring – it has to
 * include the surrounding characters to get an accurate classification.
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
