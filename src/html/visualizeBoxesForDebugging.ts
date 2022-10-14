import { tagNode } from "src/html/tagNode";
import { Line } from "src/index";

/**
 * Draw boxes at the end of a paragraph (in a browser context)
 * on screen to see any possible mismatches in size calculations
 */
export function visualizeBoxesForDebugging(
  lines: Line[],
  appendToElement: HTMLElement
) {
  // /* Remove previous debugging boxes */
  // appendToElement.querySelectorAll(".debug-line").forEach((el) => el.remove());
  const box1 = tagNode(document.createElement("div"));
  box1.classList.add("debug-line");
  box1.style.position = "relative";
  box1.style.height = lines.length * 15 + "px";
  box1.style.marginLeft = window.getComputedStyle(appendToElement).paddingLeft;
  box1.style.height = window.getComputedStyle(appendToElement).height;
  console.log(lines);

  lines.forEach((line) => {
    let yOffset = (line.lineIndex + 1) * 15;
    line.positionedItems.forEach((item) => {
      let xOffset = item.xOffset;
      const box = tagNode(document.createElement("div"));
      box.style.position = "absolute";
      box.style.left = xOffset + "px";
      box.style.top = yOffset + "px";
      box.style.height = "10px";
      box.style.width = item.width + "px";
      box.style.background = "#7272ed80";
      box.style.font = "9px sans-serif";
      if ("text" in item) {
        box.innerHTML = item.text || "";
      }
      // else if (item.type !== "glue") {
      //   box.innerHTML = "?";
      // }
      if (item.type === "penalty") {
        box.style.background = "rgb(185,0,0)";
        box.innerHTML = "";
        box.style.minWidth = "1px";
      }
      box1.appendChild(box);
    });
  });
  appendToElement.after(box1);
}
