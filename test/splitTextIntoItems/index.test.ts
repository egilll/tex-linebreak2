import { assert } from "chai";
import { texLinebreakMonospace } from "src/presets/presets";
import { hyphenateFn } from "test/testUtils/enHyphenateFn";

it("lays out lines applying hyphenation", () => {
  const text = `When the first paper volume of Donald Knuth's The Art of Computer Programming was published in 1968,[4] it was typeset using hot metal typesetting set by a Monotype Corporation typecaster. This method, dating back to the 19th century, produced a "good classic style" appreciated by Knuth.`;

  const lines = texLinebreakMonospace(text, {
    lineWidth: 31,
    infiniteGlueStretchAsRatioOfWidth: 0.5,
    softHyphenPenalty: 10,
    hyphenateFn,
  }).plaintextLines;
  const expectedLines = [
    "When the first paper volume of",
    "Donald Knuth's The Art of Com-",
    "puter Programming was published",
    "in 1968,[4] it was typeset",
    "using hot metal typesetting",
    "set by a Monotype Corporation",
    "typecaster. This method, dat-",
    "ing back to the 19th century,",
    'produced a "good classic style"',
    "appreciated by Knuth.",
  ];
  assert.deepEqual(lines, expectedLines);
});
