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

const width = 32;
console.log(
  "_".repeat(width) +
    "\n" +
    texLinebreakMultiple(
      [
        {
          input: `{@link @microsoft/signalr.LogLevel}, axx string`,
          lineWidth: width,
        },
      ],
      {
        preset: "plaintext",
        // neverBreakInside: /{@.+?}/,
        // infiniteGlueStretchAsRatioOfWidth: 0,
        collapseSingleNewlines: true,
        lineBreakingAlgorithm: "greedy",
        hangingPunctuation: false,
      }
    )
      .map((t) => t.plaintext)
      .join("\n~\n")
);
