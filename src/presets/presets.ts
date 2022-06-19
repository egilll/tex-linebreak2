import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import stringWidth from "string-width";
// import(
//           /* webpackChunkName: "stringWidth" */
//           "string-width"
//         )

export const TexLinebreakPresets: {
  [key: string]: Partial<TexLinebreakOptions>;
} = {
  raggedAlignment: {
    softHyphenPenalty: 500,
    penaltyMultiplier: 4,
    glueShrinkFactor: 0.2,
    glueStretchFactor: 0.3,
    renderLineAsLeftAlignedIfAdjustmentRatioExceeds: 1,
    infiniteGlueStretchAsRatioOfWidth: 0.4,
  },
  html: {
    collapseAllNewlines: true,
    // Temp: Needs work
    forceOverflowToBreak: false,
  },
  plaintext: {
    measureFn: stringWidth,
    align: "left",
    onlyBreakOnWhitespace: true,
    forceOverflowToBreak: false,
    glueStretchFactor: 0,
    glueShrinkFactor: 0,
    infiniteGlueStretchAsRatioOfWidth: 0,
    /** Not relevant by default since `onlyBreakOnWhitespace` is on */
    softHyphenOutput: "HYPHEN",
  },
};

/**
 * A preset that includes a measureFn for monospace text.
 * The package `stringWidth` adds an additional 10kb to the output.
 */
export function texLinebreakMonospace(
  input: ConstructorParameters<typeof TexLinebreak>[0],
  options: Partial<TexLinebreakOptions>
): TexLinebreak {
  return new TexLinebreak(input, {
    measureFn: stringWidth,
    softHyphenOutput: "HYPHEN",
    ...options,
  });
}
