import { outputElement } from "src/demo/userInput";
import { TexLinebreak } from "src/index";
import { TexLinebreakOptions } from "src/options";
import { TextItem } from "src/utils/items";
import { isSoftHyphen } from "src/utils/utils";

export const canvas = document.querySelector("canvas")!;

/** Render a string as justified text into a `<canvas>`. */
export function renderToCanvas(
  text: string,
  margins: { left: number; right: number },
  lineWidth: number,
  options: Partial<TexLinebreakOptions> = {}
) {
  const outputElementStyle = window.getComputedStyle(outputElement);
  const lineSpacing = parseInt(outputElementStyle.lineHeight);
  setCanvasSize(canvas, lineWidth + margins.left + margins.right, 500);
  const canvasRenderingContext = canvas.getContext("2d")!;
  canvasRenderingContext.clearRect(
    0,
    0,
    canvasRenderingContext.canvas.width,
    canvasRenderingContext.canvas.height
  );
  canvasRenderingContext.font = "16px serif";

  const lines = new TexLinebreak<TextItem>(text, {
    ...options,
    lineWidth,
    measureFn: (t: string) => canvasRenderingContext.measureText(t).width,
  }).lines;

  lines.forEach((line) => {
    const yOffset = (line.lineIndex + 1) * lineSpacing;
    line.positionedItems.forEach((item) => {
      let text = item.type === "box" && item.text;
      if (isSoftHyphen(item)) {
        text = "-";
      }
      let xOffset = margins.left + item.xOffset;
      if (text) {
        canvasRenderingContext.fillText(text, xOffset, yOffset);
      }
    });
  });
}

/** Set the size of a canvas, adjusting for high-DPI displays. */
export function setCanvasSize(
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const canvasRenderingContext = canvas.getContext("2d")!;
  canvas.style.width = width + "px";
  canvas.style.height = height + "px";
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  canvasRenderingContext.scale(
    window.devicePixelRatio,
    window.devicePixelRatio
  );
}
