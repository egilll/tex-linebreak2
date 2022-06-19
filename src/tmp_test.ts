// import { hyphenateHTMLSync } from "hyphen/en";
// hyphenateHTMLSync()
import { texLinebreakMonospace } from "src/presets/presets";

console.log(
  texLinebreakMonospace(`dd, jaja test tst`, {
    lineWidth: 20,
    // initialMaxAdjustmentRatio: 20,
  }).plaintextLines
);
