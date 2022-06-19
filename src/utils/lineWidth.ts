import { TexLinebreakOptions } from "src/options";

export type LineWidth = number | number[] | LineWidthObject;
export type LineWidthObject = {
  defaultLineWidth: number;
  [lineIndex: number]: number;
};

export function getMinLineWidth(lineWidths: LineWidth): number {
  if (Array.isArray(lineWidths)) {
    return Math.min(...lineWidths);
  } else if (typeof lineWidths === "number") {
    return lineWidths;
  } else {
    return Math.min(
      ...[...Object.values(lineWidths), lineWidths.defaultLineWidth]
    );
  }
}

export function getMaxLineWidth(lineWidths: LineWidth): number {
  if (Array.isArray(lineWidths)) {
    return Math.max(...lineWidths);
  } else if (typeof lineWidths === "number") {
    return lineWidths;
  } else if (typeof lineWidths === "object") {
    return Math.max(
      ...[...Object.values(lineWidths), lineWidths.defaultLineWidth]
    );
  } else {
    throw new Error("Invalid lineWidths, got " + typeof lineWidths);
  }
}

export function getLineWidth(
  lineWidths: LineWidth,
  lineIndex: number,
  options?: TexLinebreakOptions
): number {
  let output: number;
  if (Array.isArray(lineWidths)) {
    if (lineIndex < lineWidths.length) {
      output = lineWidths[lineIndex];
    } else {
      /**
       * If out of bounds, return the last width of the last line.
       * This is done since the first line may have indentation.
       */
      output = lineWidths.at(-1)!;
    }
  } else if (typeof lineWidths === "number") {
    output = lineWidths;
  } else {
    output = lineWidths[lineIndex] || lineWidths.defaultLineWidth;
  }
  if (options?.makeLineWidthSmallerBy && options.makeLineWidthSmallerBy > 0) {
    output -= options.makeLineWidthSmallerBy;
  }
  return output;
}

export function makeLineWidthSmallerBy(
  lineWidths: LineWidth,
  amount: number
): LineWidth {
  if (Array.isArray(lineWidths)) {
    return lineWidths.map((width) => width - amount);
  } else if (typeof lineWidths === "number") {
    return lineWidths - amount;
  } else {
    let output: any = {};
    Object.keys(lineWidths).forEach((lineIndex) => {
      output[lineIndex] -= amount;
    });
    return output as LineWidth;
  }
}
