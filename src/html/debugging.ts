import { Line } from 'src/index';
import { tagNode } from 'src/html/tagNode';

/**
 * Draw boxes
 *
 * At the end of a paragraph (in a browser context).
 *
 * On screen to see any possible mismatches in size calculations
 */
export const visualizeBoxesForDebugging = (lines: Line[], appendToElement: HTMLElement) => {
  /* Remove previous debugging boxes */
  document.querySelectorAll('.debug-line').forEach((el) => el.remove());
  const box1 = tagNode(document.createElement('div'));
  box1.classList.add('debug-line');
  box1.style.position = 'relative';
  box1.style.height = lines.length * 15 + 'px';
  console.log({ lines });

  lines.forEach((line) => {
    let yOffset = (line.lineIndex + 1) * 15;
    line.positionedItems.forEach((item) => {
      let xOffset = item.xOffset;
      const box = tagNode(document.createElement('div'));
      box.style.position = 'absolute';
      box.style.left = xOffset + 'px';
      box.style.top = yOffset + 'px';
      box.style.height = '10px';
      box.style.width = item.width + 'px';
      box.style.background = '#7272ed80';
      box.style.font = '9px sans-serif';
      box.innerHTML = 'text' in item ? item.text : '?';
      box1.appendChild(box);
    });
  });
  appendToElement.after(box1);
};
