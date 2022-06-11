// import "src/demo/circle";
import { longTexts } from "src/demo/texts/long";
import { texts2 } from "src/demo/texts/texts";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";
import { TexLinebreakOptions } from "src/options";
// import { texts2 } from "src/demo/texts/texts";
// import "src/demo/userInput";
// import { texLinebreakDOM } from "src/html/texLinebreakDOM";
// import { hyphenateFn } from "test/utils/enHyphenateFn";
//
// if (false) {
//   const text = texts2.tmp;
//   // const text = texts[0];
//
//   const outputElement = document.getElementById("demo-output")! as HTMLElement;
//   outputElement.innerHTML = text.html;
//   // outputElement.style.textAlign = 'center';
//   // outputElement.style.fontStyle = 'italic';
//
//   texLinebreakDOM(outputElement, { hyphenateFn, ...text.options });
// }

export type ListOfDemos = {
  id: string;
  content: string;
  options?: Partial<TexLinebreakOptions>;
  style?: Partial<CSSStyleDeclaration>;
  selector?: string;
}[];
const demos: ListOfDemos = [...texts2, ...longTexts];

if (window.location.hash) {
  renderDemo(demos.find((demo) => demo.id === window.location.hash.slice(1))!);
} else {
  demos.forEach(renderDemo);
}

function renderDemo(demo: ListOfDemos[number]) {
  const div = document.createElement("div");
  div.innerHTML = demo.content;
  div.className = "demo-output";
  document.getElementById("output-container")!.appendChild(div);
  console.log(demo);
  const element = demo.selector
    ? div.querySelectorAll<HTMLElement>(demo.selector)
    : div;
  texLinebreakDOM(element, demo.options || {});
}
