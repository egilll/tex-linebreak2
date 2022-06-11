// import enUsPatterns from "hyphenation.en-us";
// import Hypher from "hypher";
// import { texLinebreakMonospace } from "src/utils/monospace";
//
// const hypher = new Hypher(enUsPatterns);
//
// const text = `1968,[4] it`;
// const t = texLinebreakMonospace(text, {
//   lineWidth: 31,
//   infiniteGlueStretchAsRatioOfWidth: 0.5,
//   softHyphenPenalty: 10,
//   hangingPunctuation: false,
//   // hyphenateFn: (x: string) => hypher.hyphenate(x),
// });
//
// console.log(t.items);
// // console.log(t.plainTextLines.slice(-4));

let pattern = "t tt";
let input = "asdt tter tt ttd";
let output: number[] = [];
let i = -1;
while ((i = input.indexOf(pattern, i + 1)) !== -1) {
  for (let j = 1; j < pattern.length - 1; j++) {
    output.push(i + j);
  }
}
console.log({ output });
