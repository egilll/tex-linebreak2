import { Item } from "src/breakLines";
import { DOMItem } from "src/html/getItemsFromDOM/index";
import {
  makeGlueAtBeginningZeroWidth,
  makeGlueAtEndZeroWidth,
} from "src/utils/collapseGlue";
import { makeNonBreaking } from "src/utils/utils";

export type TemporaryControlItem = {
  type:
    | "IGNORE_WHITESPACE_AFTER"
    | "IGNORE_WHITESPACE_BEFORE"
    | "START_NON_BREAKING_RANGE"
    | "END_NON_BREAKING_RANGE"
    | "MERGE_THIS_BOX_WITH_NEXT_BOX"
    | "MERGE_THIS_BOX_WITH_PREVIOUS_BOX";
};
export function isControlItem(item: Item | TemporaryControlItem) {
  return item.type && !["box", "glue", "penalty"].includes(item.type);
}

export function processControlItems(
  items: (DOMItem | TemporaryControlItem)[]
): DOMItem[] {
  const deletedItems = new Set<DOMItem>();

  /** Merge temporary boxes */
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (
      item?.type === "box" &&
      items[i - 1]?.type === "MERGE_THIS_BOX_WITH_NEXT_BOX"
    ) {
      const nextBox = items
        .slice(i + 1)
        .find(
          (item) =>
            (typeof item === "object" && item.type === "box") ||
            item.type === "MERGE_THIS_BOX_WITH_PREVIOUS_BOX"
        );
      if (!nextBox || isControlItem(nextBox)) {
        throw new Error(
          "Expected a box inside element. Empty boxes with borders or padding are not yet supported."
        );
      }
      (nextBox as DOMItem).width += item.width;
      deletedItems.add(item);
    }

    if (
      item?.type === "box" &&
      items[i - 1]?.type === "MERGE_THIS_BOX_WITH_PREVIOUS_BOX"
    ) {
      const prevBox = items
        .slice(i - 1)
        .reverse()
        .find(
          (item) =>
            (typeof item === "object" && item.type === "box") ||
            item.type === "MERGE_THIS_BOX_WITH_NEXT_BOX"
        );
      if (!prevBox || isControlItem(prevBox)) {
        throw new Error(
          "Expected a box inside element. Empty boxes with borders or padding are not yet supported."
        );
      }
      (prevBox as DOMItem).width += item.width;
      deletedItems.add(item);
    }
  }

  /** Process whitespace */
  const ignoreWhitespaceAfter = new Set<number>([0]);
  const ignoreWhitespaceBefore = new Set<number>();
  const nonBreakingRanges = new Map<number, number>();

  let openNonBreakingRanges: number[] = [];
  let output: DOMItem[] = [];
  items.forEach((item) => {
    if (!isControlItem(item)) {
      if (!deletedItems.has(item)) {
        output.push(item);
      }
    } else {
      switch (item) {
        case "IGNORE_WHITESPACE_AFTER":
          ignoreWhitespaceAfter.add(output.length);
          break;
        case "IGNORE_WHITESPACE_BEFORE":
          ignoreWhitespaceBefore.add(output.length);
          break;
        case "START_NON_BREAKING_RANGE":
          openNonBreakingRanges.push(output.length);
          break;
        case "END_NON_BREAKING_RANGE":
          const start = openNonBreakingRanges.pop();
          if (start !== undefined) {
            nonBreakingRanges.set(start, output.length);
          }
      }
    }
  });

  ignoreWhitespaceAfter.forEach((index) => {
    makeGlueAtBeginningZeroWidth(output, index, true);
  });
  ignoreWhitespaceBefore.forEach((index) => {
    makeGlueAtEndZeroWidth(output, index!, true);
  });
  nonBreakingRanges.forEach((startIndex, endIndex) => {
    makeNonBreaking(output, startIndex, endIndex);
  });
  return output;
}
