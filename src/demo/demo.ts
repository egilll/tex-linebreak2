import "src/demo/circle";
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
  html: string;
  options?: Partial<TexLinebreakOptions>;
  style?: Partial<CSSStyleDeclaration>;
}[];
const demos: ListOfDemos = [];

if (window.location.hash) {
  // demos.find((demo) => demo === window.location.hash.slice(1));
} else {
  // Fragment doesn't exist
}
