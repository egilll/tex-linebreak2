import { HelperOptions } from 'src/helpers/options';
import LineBreaker, { Break } from 'linebreak';
import {
  UnicodeLineBreakingClasses,
  convertEnumValuesOfLineBreakingPackageToUnicodeNames,
} from 'src/typings/unicodeLineBreakingClasses';
import { NON_BREAKING_SPACE } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';

const mandatoryBreaks = [
  UnicodeLineBreakingClasses.BreakMandatory,
  UnicodeLineBreakingClasses.CarriageReturn,
  UnicodeLineBreakingClasses.LineFeed,
  UnicodeLineBreakingClasses.NextLine,
];

/**
 * Characters that can stretch as glue, no matter whether they are actually
 * breakpoints or not.
 * `General_Category=Zs` are space separators
 */
const glueCharacterRegex = new RegExp(`[ \\t\\p{General_Category=Zs}${NON_BREAKING_SPACE}]`, 'u');

export type Segment = {
  text: string;
  type: 'box' | 'glue';
  breakAfter?: {
    required: boolean;
    lastLetter: string;
    lastLetterClass: UnicodeLineBreakingClasses;
    nextLetterClass: UnicodeLineBreakingClasses;
  };
};
export const splitIntoSegments = (
  input: string,
  options: HelperOptions,
  /** When splitting text inside HTML elements, the text that surrounds it matters */
  precedingText: string = '',
  followingText: string = '',
): Segment[] => {
  precedingText = precedingText.slice(-3);
  followingText = followingText.slice(0, 3);
  const inputWithSurroundingText = precedingText + input + followingText;

  const breakpoints: number[] = getBreakpoints(inputWithSurroundingText);
  let segments: Segment[] = [];

  for (let charIndex = 0; charIndex < input.length; charIndex++) {
    const char = input[charIndex];
    const indexInInputWithSurroundingText = precedingText.length + charIndex;
    const breakpointIndex = indexInInputWithSurroundingText + 1;
    /** Is there a breakpoint after this character? */
    const shouldBreakAfter = breakpoints.includes(breakpointIndex);

    const type: Segment['type'] = glueCharacterRegex.test(char) ? 'glue' : 'box';

    if (segments.length === 0 || segments.at(-1)!.breakAfter || segments.at(-1)!.type !== type) {
      segments.push({ text: '', type });
    }
    segments.at(-1)!.text += char;

    if (shouldBreakAfter) {
      const lastLetterClass = getLineBreakingClassOfLetterAt(
        inputWithSurroundingText,
        breakpointIndex,
      );
      const nextLetterClass = getLineBreakingClassOfLetterAt(
        inputWithSurroundingText,
        breakpointIndex + 1,
      );
      segments.at(-1).breakAfter = {
        required: mandatoryBreaks.includes(lastLetterClass),
        lastLetter: char,
        lastLetterClass,
        nextLetterClass,
      };
    }
  }

  return segments;
};

export const getBreakpoints = (input: string): number[] => {
  const lineBreaker = new LineBreaker(input);
  let breaks: Break[] = [];
  let nextBreak: Break;
  while ((nextBreak = lineBreaker.nextBreak())) breaks.push(nextBreak);
  return breaks.map((b) => b.position);
};

/**
 * @param input - Must be the full original string in order to classify based
 *     on the surrounding characters
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
