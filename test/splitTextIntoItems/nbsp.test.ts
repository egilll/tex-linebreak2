import { NON_BREAKING_SPACE } from "src/splitTextIntoItems/splitTextIntoItems";
import { texLinebreakMonospace } from "src/utils/monospace";

it("nbsp", () => {
  const text = `bla${NON_BREAKING_SPACE}bla${NON_BREAKING_SPACE} bla${NON_BREAKING_SPACE}bla .`;

  expect(
    texLinebreakMonospace(text, {
      lineWidth: 2,
      forceOverflowToBreak: false,
    }).plainTextLines
  ).toEqual([`bla${NON_BREAKING_SPACE}bla`, `bla${NON_BREAKING_SPACE}bla .`]);
});
