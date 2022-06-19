// import { hyphenateHTMLSync } from "hyphen/en";
import { texLinebreakMultiple } from "src/optimize/optimalWidth";
// hyphenateHTMLSync()
import { TexLinebreakPresets } from "src/presets/presets";

console.log(
  texLinebreakMultiple(
    [
      {
        input:
          "If we remove the infinite glue, the lines will try to fit the most compact way possible (without going to the next line).",
        lineWidth: 47,
      },
      {
        input: "This gives us a good starting point of sizes to try out.",
        lineWidth: 40,
      },
    ],
    TexLinebreakPresets.plaintext
  )
    .map((t) => t.plaintext)
    .join("\n~\n")
);
