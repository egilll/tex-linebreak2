import { Line } from 'src/helpers';
import { tagNode } from 'src/html/tagNode';

/**
 * Draw boxes on screen to see any possible mismatches in size calculations
 */
export const debugHtmlLines = (lines: Line[], appendToElement: HTMLElement) => {
  /* Remove previous */
  document.querySelectorAll('.debug-line').forEach((el) => el.remove());
  const box1 = tagNode(document.createElement('div'));
  box1.classList.add('debug-line');
  box1.style.position = 'relative';
  box1.style.height = lines.length * 15 + 'px';
  console.log({ lines });

  lines.forEach((line) => {
    let yOffset = line.lineNumber * 15;
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
      // @ts-ignore
      box.innerHTML = item.text || '?';
      box1.appendChild(box);
    });
  });
  appendToElement.after(box1);
};
