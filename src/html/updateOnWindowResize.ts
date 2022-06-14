import debounce from "debounce";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";
import { TexLinebreakOptions } from "src/options";

let isListening: boolean;
let elementsAndTheirWidths: Map<
  HTMLElement,
  { width: number; options: TexLinebreakOptions }
> = new Map();

export function updateOnWindowResize(
  elements: HTMLElement[],
  options: TexLinebreakOptions
) {
  if (!isListening) {
    window.addEventListener("resize", debounce(onResize, 30), true);
    isListening = true;
  }

  elements.forEach((element) => {
    elementsAndTheirWidths.set(element, {
      width: element.offsetWidth,
      options,
    });
  });
}

const onResize = () => {
  elementsAndTheirWidths.forEach(({ width, options }, element) => {
    if (element.offsetWidth !== width) {
      // Timeout in order to limit blocking of the browser's rendering thread
      setTimeout(() => {
        void texLinebreakDOM(element, options);
      }, 0);
    }
  });
};
