import { assert } from "chai";
import { texLinebreakMonospace } from "src/presets/presets";

it("neverBreakInside", () => {
  const text = `te{st test}{ t}est test`;

  assert.deepEqual(
    texLinebreakMonospace(text, {
      lineWidth: 2,
      forceOverflowToBreak: false,
      neverBreakInside: [/{.+?}/g, "t t"],
    }).plaintextLines,
    [`te{st test}`, `{ t}`, `est test`]
  );
});
