import { texLinebreakMonospace } from "src/utils/monospace";

it("forceOverflowToBreak", () => {
  // On by default
  assert.deepEqual(
    texLinebreakMonospace("A very_very_very_very_very_long_string here.", {
      lineWidth: 20,
      forceOverflowToBreak: true,
    }).plainTextLines,
    ["A very_very_", "very_very_very_long_", "string here."]
  );
  assert.deepEqual(
    texLinebreakMonospace("A very_very_very_very_very_long_string here.", {
      forceOverflowToBreak: false,
      lineWidth: 20,
    }).plainTextLines,
    ["A", "very_very_very_very_very_long_string", "here."]
  );
});
