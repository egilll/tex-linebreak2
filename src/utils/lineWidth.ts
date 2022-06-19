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

export function getLineWidth(lineWidths: LineWidth, lineIndex: number): number {
  if (Array.isArray(lineWidths)) {
    if (lineIndex < lineWidths.length) {
      return lineWidths[lineIndex];
    } else {
      /**
       * If out of bounds, return the last width of the last line.
       * This is done since the first line may have indentation.
       */
      return lineWidths.at(-1)!;
    }
  } else if (typeof lineWidths === "number") {
    return lineWidths;
  } else {
    return lineWidths[lineIndex] || lineWidths.defaultLineWidth;
  }
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
