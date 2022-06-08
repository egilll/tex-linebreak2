import enUsPatterns from "hyphenation.en-us";
import Hypher from "hypher";

export const hyphenateFn = (word: string) =>
  new Hypher(enUsPatterns).hyphenate(word);
