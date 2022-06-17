// import { hyphenateHTMLSync } from "hyphen/en";
// hyphenateHTMLSync()
import { texLinebreakMonospace } from "src/utils/monospace";

const text = `te{st test}{ t}est test`;

console.log(
  texLinebreakMonospace(text, {
    lineWidth: 2,
    forceOverflowToBreak: false,
    neverBreakInside: [/{.+?}/g, "t t"],
  }).plainTextLines
);
