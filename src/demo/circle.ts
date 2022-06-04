import enUsPatterns from 'hyphenation.en-us';
import Hypher from 'hypher';
import { texts } from 'src/demo/texts/texts';
import { justifyContent } from 'src/html/demo';

const text = new Hypher(enUsPatterns).hyphenateText(texts[0]);

const outputElement = document.getElementById('demo-output')! as HTMLElement;
outputElement.innerHTML = text;
outputElement.style.textAlign = 'center';

const circleOfHeightOne = (ratioOfTotalHeight: number) => {
  const radius = 1 / 2;
  const distanceFromCenter = Math.abs(ratioOfTotalHeight - radius);

  /** Finds chord length using perpendicular distance from center */
  return 2 * Math.sqrt(radius ** 2 - distanceFromCenter ** 2);
};

const lineHeight = parseInt(window.getComputedStyle(outputElement).lineHeight);
const height = 360;
let lineWidth = [];
for (let yOffset = lineHeight / 2; yOffset < height; yOffset += lineHeight) {
  lineWidth.push(circleOfHeightOne(yOffset / height) * height);
}

justifyContent(outputElement, { lineWidth }, true);
