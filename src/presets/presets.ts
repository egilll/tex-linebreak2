import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import stringWidth from "string-width";
// import(
//           /* webpackChunkName: "stringWidth" */
//           "string-width"
//         )

export const TexLinebreakPresets: {
  [key in
    | "raggedAlignment"
    | "html"
    | "plaintext"]: Partial<TexLinebreakOptions>;
} = {
  raggedAlignment: {
    softHyphenPenalty: 500,
    penaltyMultiplier: 4,
    glueShrinkFactor: 0.2,
    glueStretchFactor: 0.3,
    renderLineAsUnjustifiedIfAdjustmentRatioExceeds: 1.5,
    infiniteGlueStretchAsRatioOfWidth: 0.4,
    initialMaxAdjustmentRatio: 4,
  },
  html: {
    collapseAllNewlines: true,
    // Temp: Needs work
    forceOverflowToBreak: false,
  },
  plaintext: {
    measureFn: stringWidth,
    justify: false,
    onlyBreakOnWhitespace: true,
    forceOverflowToBreak: false,
    glueStretchFactor: 0,
    glueShrinkFactor: 0,
    leftHangingPunctuation: false,
    initialMaxAdjustmentRatio: 1,
    isPlaintext: true,
    infiniteGlueStretchAsRatioOfWidth: 0.4,
    /** Not relevant by default since `onlyBreakOnWhitespace` is on */
    softHyphenOutput: "HYPHEN",
    collapseSingleNewlines: true,
    /** Collapse newlines like Markdown does, keeping newlines after double spaces */
    keepSingleNewlinesAfter: ["  ", "\\"],
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
    preset: ["plaintext"],
    ...options,
  });
}
