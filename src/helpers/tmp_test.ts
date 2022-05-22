import LineBreaker, { Break } from 'linebreak';
import { UnicodeLineBreakingClasses } from 'src/typings/unicodeLineBreakingClasses';

const NON_BREAKING_SPACE = '\xa0';

/**
 * @param input - Must be the full original string, not just a word
 * @param position
 */
export const getLineBreakingClassOfLastLetter = (
  input: string,
  position: number,
): UnicodeLineBreakingClasses => {
  const j = new LineBreaker(input);
  j.pos = position - 1;
  return j.nextCharClass();
};

var input = 'eins/konar  mynd(nei)';
const breaker = new LineBreaker(input);
let lastPosition = 0;
let breakPoint: Break;
while ((breakPoint = breaker.nextBreak())) {
  const word = input.slice(lastPosition, breakPoint.position);
  const wordWithoutLastLetter = word.slice(0, -1);
  const lastLetter = word.slice(-1);

  if (breakPoint.required) {
    console.log('\n\n');
  }

  const lastLetterClass = getLineBreakingClassOfLastLetter(input, breakPoint.position);
  if (lastLetterClass === UnicodeLineBreakingClasses.Space) {
  }

  lastPosition = breakPoint.position;
}
