import Hypher, { Patterns } from 'hypher';

/**
 * Create a hyphenator that uses the given patterns.
 *
 * A wrapper around the `hypher` hyphenation library.
 * @deprecated since simply writing "new Hypher(patterns).hyphenate" is clearer.
 */
export function createHyphenator(patterns: Patterns) {
  const hypher = new Hypher(patterns);
  return (word: string) => hypher.hyphenate(word);
}
