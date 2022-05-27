import { HelperOptions } from 'src/helpers/options';
import LineBreaker, { Break } from 'linebreak';

export const allowableBreakingPointSegments = (
  input: string,
  options: HelperOptions,
  /** When splitting text inside HTML elements, the text that surrounds it matters */
  precedingText: string = '',
  followingText: string = '',
) => {
  const lineBreaker = new LineBreaker(input);
  let breakPoints: Break[] = [];
  let b: Break;
  while ((b = lineBreaker.nextBreak())) breakPoints.push(b);

  let output: any[] = [];

  for (let i = 0; i < breakPoints.length; i++) {
    const breakPoint = breakPoints[i];
    /**
     * The segment contains the word and the whitespace characters that come after it
     */
    const segment = input.slice(breakPoints[i - 1]?.position || 0, breakPoints[i].position);
  }

  return output;
};
