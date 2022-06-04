import { texts } from 'src/demo/texts/texts';
import { justifyContent } from 'src/html/demo';

const text = texts[0];

const outputElement = document.getElementById('demo-output')! as HTMLElement;
outputElement.innerHTML = text;

justifyContent(outputElement, {}, true);

const lineLengthFormula = (curLine: number) => {};

// tmp
var r = [],
  radius = 147;
for (var j = 0; j < radius * 2; j += 21) {
  r.push(Math.round(Math.sqrt((radius - j / 2) * (8 * j))));
}
r = r.filter(function (v) {
  return v > 30;
});

console.log({ r });
