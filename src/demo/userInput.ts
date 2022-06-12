import { renderToCanvas } from "src/demo/canvas";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";

export const textarea = document.querySelector("textarea")!;
export const lineWidthSlider = document.querySelector(
  ".js-line-width"
)! as HTMLInputElement;
export const outputElement = document.querySelector(
  ".output-p"
)! as HTMLElement;
export const plainBrowserOutputElement = document.querySelector(
  ".css-output-p"
)! as HTMLElement;

export function renderUserInput() {
  const lineWidth = parseInt(lineWidthSlider.value);
  const outputElementStyle = window.getComputedStyle(outputElement);
  document.body.style.setProperty("--line-width", `${lineWidth}px`);

  const htmlParagraph = document.querySelector<HTMLElement>(".html-p")!;
  htmlParagraph.innerHTML = textarea.value;
  texLinebreakDOM(htmlParagraph, {
    // hyphenateFn: hyphenateFn,
  });

  // Render to canvas.
  renderToCanvas(
    textarea.value,
    {
      left: parseInt(outputElementStyle.paddingLeft!),
      right: parseInt(outputElementStyle.paddingRight!),
    },
    lineWidth
  );

  // Render using CSS `text-justify`
  plainBrowserOutputElement.innerHTML = textarea.value;
}

// Re-render on changes.
textarea.addEventListener("input", renderUserInput);
lineWidthSlider.addEventListener("input", renderUserInput);
renderUserInput();
