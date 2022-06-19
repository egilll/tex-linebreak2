import { assert } from "chai";
import { texLinebreakMonospace } from "src/presets/presets";
import { NON_BREAKING_SPACE } from "src/splitTextIntoItems/splitTextIntoItems";

it("nbsp", () => {
  const text = `bla${NON_BREAKING_SPACE}bla${NON_BREAKING_SPACE} bla${NON_BREAKING_SPACE}bla .`;

  assert.deepEqual(
    texLinebreakMonospace(text, {
      lineWidth: 2,
      forceOverflowToBreak: false,
    }).plaintextLines,
    [`bla${NON_BREAKING_SPACE}bla`, `bla${NON_BREAKING_SPACE}bla .`]
  );
});
