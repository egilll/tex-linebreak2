import { Box, Glue, MAX_COST, MIN_COST, Penalty } from "src/breakLines";
import { TexLinebreakOptions } from "src/options";
import {
  getLineFinalStretchInNonJustified,
  getSpaceWidth,
  infiniteGlue,
} from "src/utils/utils";

export interface TextBox extends Box {
  text?: string;
}

export interface TextGlue extends Glue {
  text?: string;
}

export type TextItem = TextBox | TextGlue | Penalty;

export function box(width: number): Box;
export function box(width: number, text: string): TextBox;
export function box(width: number, text?: string): Box | TextBox {
  if (text) {
    return { type: "box", width, text };
  } else {
    return { type: "box", width };
  }
}

/** (Stretch comes before shrink as in the original paper) */
export function glue(
  width: number,
  stretch: number = 0,
  shrink: number = 0,
  text?: string
): Glue | TextGlue {
  if (text) {
    return { type: "glue", width, shrink, stretch, text };
  } else {
    return { type: "glue", width, shrink, stretch };
  }
}

export function penalty(
  width: number,
  cost: number,
  flagged: boolean = false
): Penalty {
  return { type: "penalty", width, cost, flagged };
}

export function textBox(
  text: string,
  options: TexLinebreakOptions
): TextItem[] {
  if (options.hyphenateFn && !options.onlyBreakOnWhitespace) {
    let out: TextItem[] = [];
    const chunks = options.hyphenateFn(text);
    chunks.forEach((c, i) => {
      out.push(box(options.measureFn(c), c));
      if (i < chunks.length - 1) {
        out.push(...softHyphen(options));
      }
    });
    return out;
  } else {
    return [box(options.measureFn(text), text)];
  }
}

export function textGlue(
  text: string,
  options: TexLinebreakOptions,
  cost: number = 0
): TextItem[] {
  const spaceShrink = getSpaceWidth(options) * options.glueShrinkFactor;
  const spaceStretch = getSpaceWidth(options) * options.glueStretchFactor;
  if (options.justify) {
    /** Spaces in justified lines */
    return [glue(getSpaceWidth(options), spaceStretch, spaceShrink, text)];
  } else {
    /**
     * Spaces in ragged lines. See p. 1139.
     * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
     * (Todo: Ragged line spaces should perhaps be allowed to stretch
     * a bit, but it should probably still be listed as zero here since
     * otherwise a line with many spaces is more likely to be a good fit.)
     */
    return [
      glue(
        0,
        getLineFinalStretchInNonJustified(options) + spaceStretch,
        spaceShrink,
        text
      ),
      penalty(0, cost),
      glue(
        getSpaceWidth(options),
        -getLineFinalStretchInNonJustified(options),
        0
      ),
    ];
  }
}

export function softHyphen(options: TexLinebreakOptions): TextItem[] {
  const hyphenWidth = options.hangingPunctuation ? 0 : options.measureFn("-");
  if (options.justify) {
    return [penalty(hyphenWidth, options.softHyphenPenalty, true)];
  } else {
    /**
     * Optional hyphenations in unjustified text are slightly tricky as:
     * "After the breakpoints have been chosen using the above sequences
     * for spaces and for optional hyphens, the individual lines
     * should not actually be justified, since a hyphen inserted by the
     * ‘penalty(6,500,1)’ would otherwise appear at the right margin." (p. 1139)
     */
    return [
      penalty(0, MAX_COST),
      glue(0, getLineFinalStretchInNonJustified(options), 0),
      penalty(hyphenWidth, options.softHyphenPenalty, true),
      glue(0, -getLineFinalStretchInNonJustified(options), 0),
    ];
  }
}

export function forcedBreak(): Penalty {
  return penalty(0, MIN_COST);
}

export function paragraphEnd(options: TexLinebreakOptions): TextItem[] {
  let output: TextItem[] = [];
  if (!options.justify) {
    output.push(glue(0, getLineFinalStretchInNonJustified(options), 0));
  }
  if (options.addInfiniteGlueToFinalLine) {
    output.push(infiniteGlue());
  }
  output.push(forcedBreak());
  return output;
}
