import "core-js/stable/array/at";

import { breakLines, Item, MIN_ADJUSTMENT_RATIO } from "src/breakLines";
import { DOMItem } from "src/html/getItemsFromDOM";
import { optimizeByFn } from "src/optimize/optimizeByFn";
import { getOptionsWithDefaults, TexLinebreakOptions } from "src/options";
import {
  NON_BREAKING_SPACE,
  SOFT_HYPHEN,
  splitTextIntoItems,
} from "src/splitTextIntoItems/splitTextIntoItems";
import { breakLinesGreedy } from "src/utils/greedy";
import { TextBox, TextGlue, TextItem } from "src/utils/items";
import {
  getLineWidth,
  getStretch,
  isForcedBreak,
  isSoftHyphen,
} from "src/utils/utils";

export type ItemPosition = { xOffset: number; adjustedWidth: number };

export class TexLinebreak<
  InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item
> {
  items: InputItemType[];
  options: TexLinebreakOptions;
  constructor(
    input: string | InputItemType[],
    options: Partial<TexLinebreakOptions>
    // options: RequireOnlyCertainKeys<TexLinebreakOptions, 'lineWidth'>,
  ) {
    this.options = getOptionsWithDefaults(options);
    if (typeof input === "string") {
      this.items = splitTextIntoItems(input, this.options) as InputItemType[];
    } else {
      this.items = input;
    }
  }

  /** Returns the indices of items which are breakpoints */
  get breakpoints(): number[] {
    if (!this.options.lineWidth) {
      throw new Error("The option `lineWidth` is required");
    }
    if (this.options.lineBreakingType === "greedy") {
      return breakLinesGreedy(this.items, this.options);
    } else {
      if (this.options.optimizeByFn) {
        return optimizeByFn(this);
      }
      return breakLines(this.items, this.options);
    }
  }

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
      if (!line.isExtranousLine) {
        lines.push(line);
      }
    }
    return lines;
  }

  get plainTextLines(): string[] {
    return this.lines.map((line) => line.plainText);
  }

  get plainText(): string {
    return this.plainTextLines.join("\n");
  }
}

export class Line<
  InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item
> {
  items: InputItemType[];
  positionedItems: (InputItemType & ItemPosition)[];
  adjustmentRatio: number;
  /**
   * Items that matter for the purposes of rendering this
   * line (i.e. filters out certain glues and penalties)
   */
  itemsFiltered: InputItemType[];
  options: TexLinebreakOptions;
  constructor(
    public parentClass: TexLinebreak<any>,
    public startBreakpoint: number,
    public endBreakpoint: number,
    public lineIndex: number
  ) {
    this.options = parentClass.options;
    this.items = parentClass.items.slice(
      this.startBreakpoint === 0 ? 0 : this.startBreakpoint + 1,
      this.endBreakpoint + 1
    );
    this.itemsFiltered = this.getItemsFiltered();
    this.adjustmentRatio = this.getAdjustmentRatio();
    this.positionedItems = this.getPositionedItems();

    if (isNaN(this.adjustmentRatio)) {
      console.log(this);
      throw new Error("Adjustment ratio is NaN");
    }
  }

  /**
   * Returns items to be displayed with their
   * position information ({@see ItemPosition}).
   */
  getPositionedItems(): (InputItemType & ItemPosition)[] {
    const output: (InputItemType & ItemPosition)[] = [];
    let xOffset = this.leftIndentation;
    this.itemsFiltered.forEach((item) => {
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
   */
  get isExtranousLine() {
    return (
      !this.itemsFiltered.some((item) => item.type === "box") &&
      isForcedBreak(this.parentClass.items[this.endBreakpoint]) &&
      !isForcedBreak(this.parentClass.items[this.startBreakpoint])
    );
  }

  getAdjustmentRatio(): number {
    const idealWidth = getLineWidth(this.options.lineWidth, this.lineIndex);
    let actualWidth = 0;
    let lineShrink = 0;
    let lineStretch = 0;
    this.itemsFiltered.forEach((item) => {
      actualWidth += item.width;
      if (item.type === "glue") {
        lineShrink += item.shrink;
        lineStretch += getStretch(item, this.options);
      }
    });
    if (actualWidth < idealWidth) {
      if (lineStretch > 0) {
        let adjustmentRatio = (idealWidth - actualWidth) / lineStretch;
        if (
          typeof this.options
            .renderLineAsLeftAlignedIfAdjustmentRatioExceeds === "number"
        ) {
          adjustmentRatio = Math.min(
            adjustmentRatio,
            this.options.renderLineAsLeftAlignedIfAdjustmentRatioExceeds
          );
        }
        return adjustmentRatio;
      } else {
        return 0;
      }
    } else {
      if (lineShrink > 0) {
        const j = (idealWidth - actualWidth) / lineShrink;
        return Math.max(MIN_ADJUSTMENT_RATIO, j);
      } else {
        return 0;
      }
    }
  }

  getItemsFiltered(): InputItemType[] {
    let itemsFiltered = this.items.filter((item, curIndex, items) => {
      // Ignore penalty that's not the breakpoint
      if (item.type === "penalty" && curIndex !== items.length - 1)
        return false;

      // Ignore glue that is a breakpoint
      if (item.type === "glue" && curIndex === items.length - 1) return false;

      return true;
    });

    /** Ignore glue at the beginning of a line (can be multiple adjacent glues) */
    for (let i = 0; i < itemsFiltered.length; i++) {
      if (itemsFiltered[i].type === "glue") {
        itemsFiltered.splice(i, 1);
        i--;
      } else {
        break;
      }
    }

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

    /** Filter glues that have canceled out (see discussion on negative glue) */
    itemsFiltered = itemsFiltered.filter(
      (i) =>
        !(
          i.type === "glue" &&
          !("text" in i && i.text) &&
          i.width === 0 &&
          i.stretch === 0 &&
          i.shrink === 0
        )
    );

    return itemsFiltered;
  }

  get plainText() {
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
            const text = (item as TextGlue).text || "";
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
    );
  }

  get endsWithSoftHyphen(): boolean {
    return isSoftHyphen(this.items.at(-1));
  }
}
