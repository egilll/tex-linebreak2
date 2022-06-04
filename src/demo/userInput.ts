import enUsPatterns from 'hyphenation.en-us';
import Hypher from 'hypher';
import { renderToCanvas } from 'src/demo/canvas';
import { justifyContent } from 'src/html/justifyContent';

export const hyphenateFn = (word: string) => new Hypher(enUsPatterns).hyphenate(word);

export const textarea = document.querySelector('textarea')!;
export const lineWidthSlider = document.querySelector('.js-line-width')! as HTMLInputElement;
export const outputElement = document.querySelector('.output-p')! as HTMLElement;
export const plainBrowserOutputElement = document.querySelector('.css-output-p')! as HTMLElement;

export function renderUserInput() {
  const lineWidth = parseInt(lineWidthSlider.value);
  const outputElementStyle = window.getComputedStyle(outputElement);
  document.body.style.setProperty('--line-width', `${lineWidth}px`);

  const padding = {
    left: parseInt(outputElementStyle.paddingLeft!),
    right: parseInt(outputElementStyle.paddingRight!),
  };
  const htmlParagraph = document.querySelector<HTMLElement>('.html-p')!;
  htmlParagraph.innerHTML = textarea.value;
  const textContent = htmlParagraph.textContent!;

  justifyContent(htmlParagraph, {
    softHyphenPenalty: 30,
  });

  // Render to canvas.
  renderToCanvas(textContent, padding, lineWidth);

  // Render using CSS `text-justify`
  plainBrowserOutputElement.innerHTML = textarea.value;
}

// Re-render on changes.
textarea.addEventListener('input', renderUserInput);
lineWidthSlider.addEventListener('input', renderUserInput);
// rerender();
