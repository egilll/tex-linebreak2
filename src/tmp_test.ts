import enUsPatterns from "hyphenation.en-us";
import Hypher from "hypher";
import { texLinebreakMonospace } from "src/utils/monospace";

const hypher = new Hypher(enUsPatterns);

const text = `When the first paper volume of Donald Knuth's The Art of Computer Programming was published in 1968,[4] it was typeset using hot metal typesetting set by a Monotype Corporation typecaster. This method, dating back to the 19th century, produced a "good classic style" appreciated by Knuth.`;
const t = texLinebreakMonospace(text, {
  lineWidth: 31,
  infiniteGlueStretchAsRatioOfWidth: 0.5,
  softHyphenPenalty: 10,
  hyphenateFn: (x: string) => hypher.hyphenate(x),
});

console.log(t.items.slice(-4));
console.log(t.plainTextLines.slice(-4));
