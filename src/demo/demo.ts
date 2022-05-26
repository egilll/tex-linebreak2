/**
 * The "layout" demo illustrates simple usage of the TeX line-breaking algorithm
 * to lay out a paragraph of justified text and render it into an HTML canvas.
 */

import Hypher from 'hypher';
import enUsPatterns from 'hyphenation.en-us';

import { TextBox } from 'src/helpers/util';
import { layoutText } from 'src/helpers/positionItems';
import { justifyContent } from 'src/html/justifyContent';

const hyphenator = new Hypher(enUsPatterns);
const hyphenate = (word: string) => hyphenator.hyphenate(word);

/**
 * Render a string as justified text into a `<canvas>`.
 */
function renderToCanvas(c: HTMLCanvasElement, t: string, margins: { left: number; right: number }) {
  const canvasRenderingContext = canvas.getContext('2d')!;
  canvasRenderingContext.clearRect(
    0,
    0,
    canvasRenderingContext.canvas.width,
    canvasRenderingContext.canvas.height,
  );

  const leftMargin = margins.left;
  const rightMargin = margins.right;
  const lineWidth = c.width / window.devicePixelRatio - leftMargin - rightMargin;

  // Generate boxes, glues and penalties from input string.
  const { items, positions } = layoutText(
    t,
    lineWidth,
    (w) => canvasRenderingContext.measureText(w).width,
    (w) => hyphenator.hyphenate(w),
  );

  // Render each line.
  const lineSpacing = 30;
  positions.forEach((p) => {
    const yOffset = (p.line + 1) * lineSpacing;
    const item = items[p.item];
    const text = item.type === 'box' ? (item as TextBox).text : '-';
    let xOffset = leftMargin + p.xOffset;
    canvasRenderingContext.fillText(text, xOffset, yOffset);
  });
}

const textarea = document.querySelector('textarea')!;
const canvas = document.querySelector('canvas')!;
const lineWidthSlider = document.querySelector('.js-line-width')! as HTMLInputElement;
const outputElement = document.querySelector('.output-p')! as HTMLElement;
const plainBrowserOutputElement = document.querySelector('.css-output-p')! as HTMLElement;

/**
 * Set the size of a canvas, adjusting for high-DPI displays.
 */
function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = canvas.getContext('2d')!;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}

function rerender() {
  const lineWidth = parseInt(lineWidthSlider.value);
  const outputElementStyle = window.getComputedStyle(outputElement);
  const padding = {
    left: parseInt(outputElementStyle.paddingLeft!),
    right: parseInt(outputElementStyle.paddingRight!),
  };
  document.body.style.setProperty('--line-width', `${lineWidth}px`);

  // Render as HTML.
  const htmlParagraph = document.querySelector('.html-p')! as HTMLElement;
  htmlParagraph.innerHTML = textarea.value;
  const textContent = htmlParagraph.textContent!;
  // justifyContent(htmlParagraph, hyphenate);
  justifyContent(htmlParagraph);

  // Render to canvas.
  setCanvasSize(canvas, lineWidth + padding.left + padding.right, 500);
  canvas.getContext('2d')!.font = '13pt sans serif';
  renderToCanvas(canvas, textContent, padding);

  // Render using CSS `text-justify`
  plainBrowserOutputElement.innerHTML = textarea.value;
}

// Render text and re-render on changes.
textarea.addEventListener('input', rerender);
lineWidthSlider.addEventListener('input', rerender);
rerender();

const htmlParagraphs = Array.from(document.querySelectorAll('.js-tex-linebreak'));
htmlParagraphs.forEach((el) => justifyContent(el as HTMLElement));
