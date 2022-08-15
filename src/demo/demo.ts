import { circle } from "src/demo/circle";
import { longTexts } from "src/demo/texts/long";
import { texts2 } from "src/demo/texts/tests";
import { various } from "src/demo/texts/various";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";
import { TexLinebreakOptions } from "src/options";

export type ListOfDemos = {
  id: string;
  description?: string;
  content: string;
  className?: string;
  options?: Partial<TexLinebreakOptions>;
  style?: Partial<CSSStyleDeclaration>;
  selector?: string;
}[];
const demos: ListOfDemos = [circle, ...various, ...longTexts, ...texts2];

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
  if ("className" in demo) {
    div.className = demo.className!;
  } else {
    div.className = "demo-output";
  }
  document.getElementById("output-container")!.appendChild(div);
  const paragraphs = demo.selector
    ? div.querySelectorAll<HTMLElement>(demo.selector)
    : div;

  if (demo.description) {
    div.insertAdjacentHTML(
      "beforebegin",
      `<div class="description">${demo.description}</div>`
    );
  }

  try {
    await texLinebreakDOM(
      paragraphs,
      demo.options || {},
      Boolean(window.location.hash)
    );
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      throw e;
    }
    console.error(e);
    div.insertAdjacentHTML(
      "beforebegin",
      `<div class="error">Error: Tex-linebreak encountered an error when breaking this paragraph.</div>`
    );
  }

  // Print unjustified for comparison
  if (window.location.hash) {
    const div2 = document.createElement("div");
    div2.className = "demo-output";
    document.getElementById("output-container")!.appendChild(div2);
  }
}
