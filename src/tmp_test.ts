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

const width = 40;
console.log(
  "_".repeat(width)+'\n'+
  texLinebreakMultiple(
    [
      {
        input:
          "Function example description that was wrapped by hand so it have more then\n" +
          "one line and don't end with a dot REPEATED TWO TIMES BECAUSE IT WAS EASIER to\n" +
          "copy function example description that was wrapped by hand so it have more\n" +
          "then one line.",
        lineWidth: width,
      },
    ],
    {
      preset: "plaintext",
      neverBreakInside: /{@.+?}/,
      // infiniteGlueStretchAsRatioOfWidth: 0,
      collapseSingleNewlines: true,
      lineBreakingAlgorithm:"greedy"
      keepSingleNewlinesAfter: ["  ", "\\", ".", ":", "!", "?", ".)"],
    }
  )
    .map((t) => t.plaintext)
    .join("\n~\n")
);
