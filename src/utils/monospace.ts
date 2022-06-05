import stringWidth from 'string-width';
import { TexLinebreak } from 'src/index';
import { OptionalCertainKeys } from 'src/options';

/** A preset that includes a measureFn for monospace text */
export const texLinebreakMonospace = (
  input: ConstructorParameters<typeof TexLinebreak>[0],
  options: OptionalCertainKeys<ConstructorParameters<typeof TexLinebreak>[1], 'measureFn'>,
): TexLinebreak => {
  return new TexLinebreak(input, {
    measureFn: stringWidth,
    ...options,
  });
};
