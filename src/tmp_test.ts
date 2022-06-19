// import { hyphenateHTMLSync } from "hyphen/en";
import { texLinebreakMultiple } from "src/optimize/optimalWidth";
// hyphenateHTMLSync()
import { TexLinebreakPresets } from "src/utils/presets";

console.log(
  texLinebreakMultiple(
    [
      {
        input: "Halskdj laskdj laksjd laskjd laskjd laskdj laskdj",
        lineWidth: 47,
      },
      {
        input: "Halskdj laskdj laksjd",
        lineWidth: 40,
      },
    ],
    TexLinebreakPresets.plaintext
  )
    .map((t) => t.plaintext)
    .join("\n~\n")
);
