import { assert } from 'chai';
import enUsPatterns from 'hyphenation.en-us';

import { createHyphenator } from 'src/helpers/deprecated/createHyphenator';

describe('hyphenate', () => {
  describe('createHyphenator', () => {
    it('creates a working hyphenation function', () => {
      const hyphenate = createHyphenator(enUsPatterns);
      assert.deepEqual(hyphenate('expectations'), ['ex', 'pec', 'ta', 'tions']);
    });
  });
});
