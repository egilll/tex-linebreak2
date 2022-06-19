import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import stringWidth from "string-width";

export const TexLinebreakPresets: {
  [key: string]: Partial<TexLinebreakOptions>;
} = {
  monospace: {
    measureFn: stringWidth,
  },
  plaintext: {
    measureFn: stringWidth,
    softHyphenOutput: "HYPHEN",
    onlyBreakOnWhitespace: true,
    forceOverflowToBreak: false,
    align: "left",
    glueStretchFactor: 0,
    glueShrinkFactor: 0,
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
