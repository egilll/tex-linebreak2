import { assert } from "chai";
import { texLinebreakMonospace } from "src/utils/monospace";

it("onlyBreakOnWhitespace", () => {
  assert.deepEqual(
    texLinebreakMonospace("Ilex-grandis-arbor-est-patula-quanta Pyrus.", {
      onlyBreakOnWhitespace: true,
      forceOverflowToBreak: false,
      lineWidth: 20,
    }).plainTextLines,
    ["Ilex-grandis-arbor-est-patula-quanta", "Pyrus."]
  );
});

// console.log(
//   texLinebreakMonospace('Ilex-grandis-arbor-est-patula-quanta Pyrus.', {
//     onlyBreakOnWhitespace: true,
//     forceOverflowToBreak: false,
//     lineWidth: 20,
//   }).plainTextLines,
// );
