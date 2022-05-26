import { layoutText } from 'src/helpers/positionItems';
import { TextBox } from 'src/helpers/util';
import { hyphenateFn } from 'src/demo/demo';
import { TexLinebreak, Line } from 'src/helpers';

export const canvas = document.querySelector('canvas')!;

/**
 * Render a string as justified text into a `<canvas>`.
 */
export function renderToCanvas(
  text: string,
  margins: { left: number; right: number },
  lineWidth: number,
) {
  // const lineWidth = canvas.width / window.devicePixelRatio - margins.left - margins.right;

  /** TODO: Find good canvas size */
  setCanvasSize(canvas, lineWidth + margins.left + margins.right, 500);

  const canvasRenderingContext = canvas.getContext('2d')!;
  canvasRenderingContext.clearRect(
    0,
    0,
    canvasRenderingContext.canvas.width,
    canvasRenderingContext.canvas.height,
  );
  canvasRenderingContext.font = '16px serif';

  const lineSpacing = 30;

  new TexLinebreak({
    text,
    lineWidth,
    hyphenateFn,
    measureFn: (t: string) => canvasRenderingContext.measureText(t).width,
  })
    .getLines()
    .forEach((line: Line) => {
      const yOffset = line.lineNumber * lineSpacing;
      const item = items[p.item];
      const text = item.type === 'box' ? (item as TextBox).text : '-';
      let xOffset = margins.left + p.xOffset;
      canvasRenderingContext.fillText(text, xOffset, yOffset);
    });

  // Render each line.
  positions.forEach((p) => {
    const yOffset = (p.line + 1) * lineSpacing;
    const item = items[p.item];
    const text = item.type === 'box' ? (item as TextBox).text : '-';
    let xOffset = margins.left + p.xOffset;
    canvasRenderingContext.fillText(text, xOffset, yOffset);
  });
}

/**
 * Set the size of a canvas, adjusting for high-DPI displays.
 */
export function setCanvasSize(canvas: HTMLCanvasElement, width: number, height: number) {
  const ctx = canvas.getContext('2d')!;
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = width * window.devicePixelRatio;
  canvas.height = height * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
}
