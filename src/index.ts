import "core-js/stable/array/at";

import { breakLines, Item } from "src/breakLines";
import { DOMItem } from "src/html/getItemsFromDOM";
import { optimizeByFnCircle } from "src/optimize/optimizeByFnCircle";
import { getOptionsWithDefaults, TexLinebreakOptions } from "src/options";
import {
  NON_BREAKING_SPACE,
  SOFT_HYPHEN,
  splitTextIntoItems,
} from "src/splitTextIntoItems/splitTextIntoItems";
import { makeZeroWidth } from "src/utils/collapseGlue";
import { breakLinesGreedy } from "src/utils/greedy";
import { TextBox, TextItem } from "src/utils/items";
import { getLineWidth } from "src/utils/lineWidth";
import {
  getStretch,
  getText,
  isForcedBreak,
  isSoftHyphen,
} from "src/utils/utils";
import { Memoize } from "typescript-memoize";

export type ItemPosition = { xOffset: number; adjustedWidth: number };

export class TexLinebreak<
  InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item
> {
  items: InputItemType[];
  options: TexLinebreakOptions;

  constructor(
    input: string | InputItemType[],
    options: Partial<TexLinebreakOptions>
  ) {
    this.options = getOptionsWithDefaults(options);
    if (typeof input === "string") {
      this.items = splitTextIntoItems(input, this.options) as InputItemType[];
    } else {
      this.items = input;
    }
  }

  /** The indices of items which are breakpoints */
  @Memoize()
  get breakpoints(): number[] {
    if (!this.options.lineWidth) {
      throw new Error("The option `lineWidth` is required");
    }
    if (this.options.lineBreakingType === "greedy") {
      return breakLinesGreedy(this.items, this.options);
    } else {
      if (this.options.optimizeByFn) {
        return optimizeByFnCircle(this);
      }
      return breakLines(this.items, this.options).breakpoints;
    }
  }

  /** An array of {@link Line} objects describing each line. */
  get lines(): Line<InputItemType>[] {
    let lines: Line<InputItemType>[] = [];
    const breakpoints = this.breakpoints;
    for (let b = 0; b < breakpoints.length - 1; b++) {
      const line = new Line<InputItemType>(
        this,
        breakpoints[b],
        breakpoints[b + 1],
        b
      );
      if (!line.isExtraneousLine) {
        lines.push(line);
      }
    }
    return lines;
  }

  get plaintextLines(): string[] {
    return this.lines.map((line) => line.plaintext);
  }

  get plaintext(): string {
    return this.plaintextLines.join("\n");
  }
}

/**
 * An object describing each line of the output.
 *
 * For most use-cases, the only property you're
 * interested in is `positionedItems`.
 */
export class Line<
  InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item
> {
  options: TexLinebreakOptions;
  constructor(
    public parentClass: TexLinebreak<any>,
    public startBreakpoint: number,
    public endBreakpoint: number,
    public lineIndex: number
  ) {
    this.options = parentClass.options;
  }

  get items(): InputItemType[] {
    return this.parentClass.items.slice(
      this.startBreakpoint === 0 ? 0 : this.startBreakpoint + 1,
      this.endBreakpoint + 1
    );
  }

  /**
   * Items with information regarding their position (xOffset)
   * and their adjusted width ({@see ItemPosition}).
   */
  @Memoize()
  get positionedItems(): (InputItemType & ItemPosition)[] {
    const output: (InputItemType & ItemPosition)[] = [];
    let xOffset = this.leftIndentation;
    this.itemsCollapsed.forEach((item) => {
      let adjustedWidth: number;
      if (this.adjustmentRatio >= 0) {
        adjustedWidth =
          item.width +
          (("stretch" in item && getStretch(item, this.options)) || 0) *
            this.adjustmentRatio;
      } else {
        adjustedWidth =
          item.width +
          (("shrink" in item && item.shrink) || 0) * this.adjustmentRatio;
      }

      output.push({
        ...item,
        xOffset,
        adjustedWidth,
      });
      xOffset += adjustedWidth;
    });

    return output;
  }

  get idealWidth() {
    return getLineWidth(this.options.lineWidth, this.lineIndex);
  }

  @Memoize()
  get adjustmentRatio(): number {
    let actualWidth = 0;
    let lineShrink = 0;
    let lineStretch = 0;
    this.itemsCollapsed.forEach((item) => {
      actualWidth += item.width;
      if (item.type === "glue") {
        lineShrink += item.shrink;
        lineStretch += getStretch(item, this.options);
      }
    });

    let adjustmentRatio: number;
    if (actualWidth < this.idealWidth) {
      if (lineStretch > 0) {
        adjustmentRatio = (this.idealWidth - actualWidth) / lineStretch;
        if (
          this.options.renderLineAsLeftAlignedIfAdjustmentRatioExceeds != null
        ) {
          adjustmentRatio = Math.min(
            adjustmentRatio,
            this.options.renderLineAsLeftAlignedIfAdjustmentRatioExceeds
          );
        }
      } else {
        adjustmentRatio = 0;
      }
    } else {
      if (lineShrink > 0) {
        adjustmentRatio = Math.max(
          this.options.minAdjustmentRatio,
          (this.idealWidth - actualWidth) / lineShrink
        );
      } else {
        adjustmentRatio = 0;
      }
    }

    if (isNaN(adjustmentRatio)) {
      console.log(this);
      throw new Error("Adjustment ratio is NaN");
    }

    return adjustmentRatio;
  }

  /**
   * Items with:
   *   - line-beginning glue collapsed (i.e. zero width)
   *   - non-breakpoint penalties filtered out
   */
  @Memoize()
  get itemsCollapsed(): InputItemType[] {
    let itemsFiltered = this.items.slice();
    let hasBoxBeenSeen: boolean;

    /**
     * Make non-important glue zero width.
     * (Not removed since this is better when re-applying justification)
     */
    itemsFiltered = itemsFiltered.map((item, index) => {
      // Glue that is a breakpoint
      if (
        item.type === "glue" &&
        (index === this.items.length - 1 || !hasBoxBeenSeen)
      ) {
        return makeZeroWidth({ ...item }) as InputItemType;
      }
      if (item.type === "box") hasBoxBeenSeen = true;
      return item;
    });

    /**
     * Ignore penalty that's not the breakpoint.
     * Note: Currently only considers soft hyphen penalties.
     */
    itemsFiltered = itemsFiltered.filter((item, curIndex, items) => {
      if (
        item.type === "penalty" &&
        (curIndex !== items.length - 1 || !isSoftHyphen(item))
      ) {
        return false;
      }
      return true;
    });

    /**
     * Handle soft hyphens in non-justified text, see
     * comment at {@link softHyphen}.
     * Moves the soft hyphen character to before the glue.
     */
    if (this.endsWithSoftHyphen && this.items.at(-2)?.type === "glue") {
      itemsFiltered.splice(
        itemsFiltered.length - 2,
        0,
        itemsFiltered.splice(itemsFiltered.length - 1, 1)[0]
      );
    }

    if (this.options.stripSoftHyphensFromOutputText) {
      for (let i = 0; i < itemsFiltered.length; i++) {
        const item = itemsFiltered[i];
        if ("text" in item && item.text) {
          /** Done to not mutate the original item */
          itemsFiltered[i] = {
            ...item,
            text: item.text.replaceAll(SOFT_HYPHEN, ""),
          };
        }
      }
    }

    // /** Filter glues that have canceled out (see discussion on negative glue) */
    // itemsFiltered = itemsFiltered.filter(
    //   (i) =>
    //     !(
    //       i.type === "glue" &&
    //       !("text" in i && i.text) &&
    //       i.width === 0 &&
    //       i.stretch === 0 &&
    //       i.shrink === 0
    //     )
    // );

    // Todo: Needs to include stretch/shrink
    // /**
    //  * Collapse negative widths. Not strictly necessary, but it saves
    //  * the output HTML from having unnecessary negative margins. (The below does not currently work)
    //  */
    // for (let index = 0; index < output.length; index++) {
    //   if (output[index].adjustedWidth < 0) {
    //     if (
    //       output[index + 1]?.type === "glue" &&
    //       output[index + 1].adjustedWidth > 0
    //     ) {
    //       const diff = -output[index].adjustedWidth;
    //       output[index].adjustedWidth = 0;
    //       output[index].xOffset += diff;
    //       output[index + 1].adjustedWidth += diff;
    //       output[index + 1].xOffset += -diff;
    //     }
    //     // output[index].adjustedWidth = 0;
    //   }
    // }

    return itemsFiltered;
  }

  get plaintext() {
    return (
      this.positionedItems
        .map((item) => {
          if (isSoftHyphen(item)) {
            switch (this.options.softHyphenOutput) {
              case "SOFT_HYPHEN":
                return SOFT_HYPHEN;
              default:
                return "-";
            }
          }
          if (item.type === "glue" && "text" in item) {
            // TODO:  COLLAPSE ADJACENT GLUE
            const text = getText(item);
            if (text.length === 0) return "";
            // TODO: OPTIONS.COLLAPSE_SPACES
            /** Does it contain any characters that are not non-breaking-spaces? */
            if (/[^\u00A0]/.test(text)) {
              /** Return a normal space */
              return " ";
            } else {
              /** Consists only of a single or many non-breaking spaces. */
              // TODO: MULTIPLE NBSP SHOULD HAVE THEIR WIDTH COUNTED DIFFERENTLY
              return NON_BREAKING_SPACE;
            }
          }
          return "text" in item ? (item as TextBox).text : "";
        })
        .join("")
        // Collapse whitespace (todo: verify this should be done)
        .replace(/\s{2,}/g, " ")
        .trim() /* Todo: verify */
    );
  }

  get prevBreakItem() {
    return this.parentClass.items[this.startBreakpoint];
  }

  get endsWithSoftHyphen(): boolean {
    return isSoftHyphen(this.items.at(-1));
  }

  get leftIndentation() {
    if (this.options.leftIndentPerLine) {
      return getLineWidth(this.options.leftIndentPerLine, this.lineIndex);
    }
    return 0;
  }

  /**
   * In certain cases such as overflowing text, the last
   * line will consist of nothing but infinite glue and the
   * final penalty. Such lines do not need to be printed.
   *
   * Todo: This should be dealt with in breakLines itself
   */
  get isExtraneousLine() {
    return (
      !this.itemsCollapsed.some((item) => item.type === "box") &&
      isForcedBreak(this.parentClass.items[this.endBreakpoint]) &&
      !isForcedBreak(this.parentClass.items[this.startBreakpoint])
    );
  }

  // /**
  //  * How much space is there left over at the right of the line (without any adjustments)?
  //  */
  // get remainingWidth() {
  //   const widthIgnoringGlueAtEnd = removeGlueAtEnd(this.itemsCollapsed).reduce(
  //     (acc, item) => acc + item.width,
  //     0
  //   );
  //   return this.idealWidth - widthIgnoringGlueAtEnd;
  // }
}
