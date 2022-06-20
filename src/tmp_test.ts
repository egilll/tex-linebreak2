// import { hyphenateHTMLSync } from "hyphen/en";
import { texLinebreakMultiple } from "src/optimize/optimalWidth";
// hyphenateHTMLSync()
import { TexLinebreakPresets } from "src/presets/presets";

console.log(
  texLinebreakMultiple(
    [
      {
        input: `
test. 

test.

`,
        lineWidth: 80,
      },
    ],
    TexLinebreakPresets.plaintext
  )
    .map((t) => t.plaintext)
    .join("\n~\n")
);

// Used by {@link oldCards} when classifying which already-seen
// cards should be chosen.
//
// TODO: This needs to be reworked, it currently only checks whether
// it has been seen once and was then given an easy rating.
