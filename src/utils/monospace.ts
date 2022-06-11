import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import stringWidth from "string-width";

/**
 * A preset that includes a measureFn for monospace text.
 * The package `stringWidth` adds an additional 10kb to the output.
 */
export const texLinebreakMonospace = (
  input: ConstructorParameters<typeof TexLinebreak>[0],
  options: Partial<TexLinebreakOptions>
): TexLinebreak => {
  return new TexLinebreak(input, {
    measureFn: stringWidth,
    softHyphenOutput: "HYPHEN",
    ...options,
  });
};
