// import { hyphenateHTMLSync } from "hyphen/en";
import { TexLinebreak } from "src/index";
// import { texLinebreakMultiple } from "src/optimize/optimalWidth";
// hyphenateHTMLSync()

console.log(
  new TexLinebreak(
    `Checks if two cards are the same card.
(Used since Card === Card doesn't work if they are the same card
just initialized at a different time, although that is currently
never possible)
`,
    {
      preset: "plaintext",
      lineWidth: 60,
      findOptimalWidth: true,
      collapseSingleNewlines: true,
      keepSingleNewlinesAfter: [".", ":", "!", "?", ".)"],
    }
  ).plaintext
);

// Used by {@link oldCards} when classifying which already-seen
// cards should be chosen.
//
// TODO: This needs to be reworked, it currently only checks whether
// it has been seen once and was then given an easy rating.

// console.log(
//   texLinebreakMultiple(
//     [
//       {
//         input: `
// test.
//
// test.
//
// `,
//         lineWidth: 80,
//       },
//     ],
//     { preset: "plaintext" }
//   )
//     .map((t) => t.plaintext)
//     .join("\n~\n")
// );
