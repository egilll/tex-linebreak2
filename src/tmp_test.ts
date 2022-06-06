import { texLinebreakMonospace } from "src/utils/monospace";

const text = `A very_very_very_very_very_long_string here.`;
const t = texLinebreakMonospace(text, {
  lineWidth: 20,
  forceOverflowToBreak: false,
});

// console.log(t.items.slice(-4));
console.log(t.plainTextLines);
