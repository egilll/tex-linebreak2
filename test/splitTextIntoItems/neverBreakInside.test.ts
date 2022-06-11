import { texLinebreakMonospace } from "src/utils/monospace";

it("neverBreakInside", () => {
  const text = `te{st test}{ t}est test`;

  expect(
    texLinebreakMonospace(text, {
      lineWidth: 2,
      forceOverflowToBreak: false,
      neverBreakInside: [/{.+?}/g, "t t"],
    }).plainTextLines
  ).toEqual([`te{st test}`, `{ t}`, `est test`]);
});
