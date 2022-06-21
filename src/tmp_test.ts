// import { hyphenateHTMLSync } from "hyphen/en";
import { TexLinebreak } from "src/index";
// import { texLinebreakMultiple } from "src/optimize/optimalWidth";
// hyphenateHTMLSync()

console.log(
  new TexLinebreak(
    `test. 
   test.

`,
    { preset: "plaintext", lineWidth: 50 }
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
