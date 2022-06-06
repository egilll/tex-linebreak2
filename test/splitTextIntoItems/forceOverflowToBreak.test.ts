import { texLinebreakMonospace } from "src/utils/monospace";

it("forceOverflowToBreak", () => {
  // On by default
  expect(
    texLinebreakMonospace("A very_very_very_very_very_long_string here.", {
      lineWidth: 20,
      forceOverflowToBreak: true,
    }).plainTextLines
  ).toEqual(["A very_very_", "very_very_very_long_", "string here."]);
  expect(
    texLinebreakMonospace("A very_very_very_very_very_long_string here.", {
      forceOverflowToBreak: false,
      lineWidth: 20,
    }).plainTextLines
  ).toEqual(["A", "very_very_very_very_very_long_string", "here."]);
});
