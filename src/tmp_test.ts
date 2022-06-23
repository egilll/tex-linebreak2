// import { hyphenateHTMLSync } from "hyphen/en";
// hyphenateHTMLSync()

// console.log(
//   new TexLinebreak(
//     `Whether a card is allowed to be chosen by {@link createCards} to be added to the session.`,
//     {
//       preset: "plaintext",
//       lineWidth: 63,
//       collapseSingleNewlines: true,
//       infiniteGlueStretchAsRatioOfWidth: 0,
//       // findOptimalWidth: true,
//       // collapseSingleNewlines: true,
//       // keepSingleNewlinesAfter: [".", ":", "!", "?", ".)"],
//       neverBreakInside: /{@.+?}/,
//     }
//   ).plaintextLines
// );
import { texLinebreakMultiple } from "src/optimize/multiple";

console.log(
  texLinebreakMultiple(
    [
      {
        input:
          "Whether a card is allowed to be chosen by {@link createCards}\nto be added to the session.",
        lineWidth: 77,
      },
    ],
    {
      preset: "plaintext",
      neverBreakInside: /{@.+?}/,
      // infiniteGlueStretchAsRatioOfWidth: 0,
      collapseSingleNewlines: true,
      keepSingleNewlinesAfter: ["  ", "\\", ".", ":", "!", "?", ".)"],
    }
  )
    .map((t) => t.plaintext)
    .join("\n~\n")
);
