import { texts } from "src/demo/texts/texts";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";
import { optimizeByFn } from "src/optimize/optimizeByFn";
import { hyphenateFn } from "test/utils/enHyphenateFn";

const text = texts[0];

const outputElement = document.getElementById("demo-output")! as HTMLElement;
outputElement.innerHTML = text;
outputElement.style.textAlign = "center";
outputElement.style.fontStyle = "italic";

const lineHeight = parseInt(window.getComputedStyle(outputElement).lineHeight);

const run = () => {
  texLinebreakDOM(
    outputElement,
    {
      optimizeByFn,
      lineHeight,
      hyphenateFn,
      addInfiniteGlueToFinalLine: false,
    }
    // true
  );
};
run();

// outputElement.addEventListener("input", debounce(run, 40));
