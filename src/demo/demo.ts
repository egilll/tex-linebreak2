// import "src/demo/circle";
// import "src/demo/userInput";

import enUsPatterns from "hyphenation.en-us";
import Hypher from "hypher";
import { texts, texts2 } from "src/demo/texts/texts";
import { hyphenateFn } from "src/demo/userInput";
import { texLinebreakDOM } from "src/html";

const text = texts2.tmp;
// const text = texts[0];

const outputElement = document.getElementById("demo-output")! as HTMLElement;
outputElement.innerHTML = text.html;
// outputElement.style.textAlign = 'center';
// outputElement.style.fontStyle = 'italic';

texLinebreakDOM(outputElement, { hyphenateFn, ...text.options });
