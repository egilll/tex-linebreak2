import { circle } from "src/demo/circle";
import { longTexts } from "src/demo/texts/long";
import { texts2 } from "src/demo/texts/texts";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";
import { TexLinebreakOptions } from "src/options";

export type ListOfDemos = {
  id: string;
  content: string;
  options?: Partial<TexLinebreakOptions>;
  style?: Partial<CSSStyleDeclaration>;
  selector?: string;
}[];
const demos: ListOfDemos = [circle, ...texts2, ...longTexts];

if (
  window.location.hash &&
  demos.some((d) => d.id === window.location.hash.slice(1))
) {
  renderDemo(demos.find((demo) => demo.id === window.location.hash.slice(1))!);
} else {
  demos.forEach(renderDemo);
}

async function renderDemo(demo: ListOfDemos[number]) {
  const div = document.createElement("div");
  div.innerHTML = demo.content;
  div.className = "demo-output";
  document.getElementById("output-container")!.appendChild(div);
  const paragraphs = demo.selector
    ? div.querySelectorAll<HTMLElement>(demo.selector)
    : div;

  try {
    await texLinebreakDOM(paragraphs, demo.options || {});
  } catch (e) {
    console.error(e);
    div.insertAdjacentHTML(
      "beforebegin",
      `<div class="error">Error: Tex-linebreak encountered an error when breaking this paragraph.</div>`
    );
  }
}
