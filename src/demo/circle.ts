import enUsPatterns from 'hyphenation.en-us';
import Hypher from 'hypher';
import { texts } from 'src/demo/texts/texts';
import { justifyContent } from 'src/html/justifyContent';

const text = new Hypher(enUsPatterns).hyphenateText(texts[0]);
// const text = texts[0];

const outputElement = document.getElementById('demo-output')! as HTMLElement;
outputElement.innerHTML = text;
// outputElement.style.textAlign = 'center';
// outputElement.style.fontStyle = 'italic';

/** Horizontal chord length of a circle given a ratio of height in circle */
const circleOfHeightOne = (ratioOfTotalHeight: number) => {
  const radius = 1 / 2;
  const distanceFromCenter = Math.abs(ratioOfTotalHeight - radius);

  /** Finds chord length using perpendicular distance from center */
  return 2 * Math.sqrt(radius ** 2 - distanceFromCenter ** 2);
};

const lineHeight = parseInt(window.getComputedStyle(outputElement).lineHeight);
const height = 360;
let lineWidth = [];
let leftIndentPerLine = [];
for (let yOffset = lineHeight / 2; yOffset < height; yOffset += lineHeight) {
  const x = circleOfHeightOne(yOffset / height) * height;
  lineWidth.push(x);
  leftIndentPerLine.push((height - x) / 2);
}

// justifyContent(outputElement, { lineWidth:300, softHyphenPenalty: 999, leftIndentPerLine });
justifyContent(
  outputElement,
  {
    lineWidth: 200,
    // justify: false,
    softHyphenPenalty: 40,
    addInfiniteGlueToTheEndOfTheLine: false,
    // renderLineAsLeftAlignedIfAdjustmentRatioExceeds: 1,
  },
  true,
);
