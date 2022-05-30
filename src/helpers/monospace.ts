import stringWidth from 'string-width';
import { TexLinebreak } from 'src/helpers/index';

/** A preset that includes a measureFn for monospace text */
export const texLinebreakMonospace = (
  input: ConstructorParameters<typeof TexLinebreak>[0],
  options: ConstructorParameters<typeof TexLinebreak>[1] = {},
): TexLinebreak => {
  return new TexLinebreak(input, {
    measureFn: stringWidth,
    ...options,
  });
};
