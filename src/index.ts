import { breakLines, Item, MIN_ADJUSTMENT_RATIO } from 'src/breakLines/breakLines';
import { breakLinesGreedy } from 'src/breakLines/greedy';
import { DOMItem } from 'src/html/getItemsFromDOM';
import { getOptionsWithDefaults, RequireOnlyCertainKeys, TexLinebreakOptions } from 'src/options';
import { SOFT_HYPHEN, splitTextIntoItems } from 'src/splitTextIntoItems/splitTextIntoItems';
import { getLineWidth, isSoftHyphen, TextBox, TextItem } from 'src/utils';

export type ItemPosition = { xOffset: number; adjustedWidth: number };

export class TexLinebreak<
  InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item,
> {
  items: InputItemType[];
  options: TexLinebreakOptions;
  constructor(
    input: string | InputItemType[],
    options: RequireOnlyCertainKeys<TexLinebreakOptions, 'lineWidth' | 'measureFn'>,
  ) {
    this.options = getOptionsWithDefaults(options);
    if (typeof input === 'string') {
      this.items = splitTextIntoItems(input, this.options) as InputItemType[];
    } else {
      this.items = input;
    }
  }
  get breakpoints(): number[] {
    if (!this.options.lineWidth) throw new Error('The option `lineWidth` is required');
    if (this.options.lineBreakingType === 'greedy') {
      return breakLinesGreedy(this.items, this.options.lineWidth);
    } else {
      return breakLines(this.items, this.options);
    }
  }
  get lines(): Line<InputItemType>[] {
    let lines: Line<InputItemType>[] = [];
    const breakpoints = this.breakpoints;
    for (let b = 0; b < breakpoints.length - 1; b++) {
      lines.push(new Line<InputItemType>(this, breakpoints[b], breakpoints[b + 1], b));
    }
    return lines;
  }
  get plainTextLines(): string[] {
    return this.lines.map((line) => line.plainText);
  }
  get plainText(): string {
    return this.plainTextLines.join('\n');
  }
}

export class Line<InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item> {
  items: InputItemType[];
  /**
   * Items that matter for the purposes of rendering this
   * line (i.e. filters out certain glues and penalties)
   */
  itemsFiltered: InputItemType[];
  idealWidth: number;
  actualWidth: number;
  adjustmentRatio: number;
  constructor(
    public parentClass: TexLinebreak<any>,
    public startBreakpoint: number,
    public endBreakpoint: number,
    public lineIndex: number,
  ) {
    this.items = parentClass.items.slice(this.startBreakpoint, this.endBreakpoint);
    this.itemsFiltered = this.getItemsFiltered();
    this.idealWidth = getLineWidth(this.parentClass.options.lineWidth, this.lineIndex);
    this.actualWidth = this.getActualWidth();
    this.adjustmentRatio = this.getAdjustmentRatio();
  }

  getActualWidth(): number {
    return (
      this.itemsFiltered.reduce((sum, item) => {
        return sum + item.width;
      }, 0) -
      this.leftHangingPunctuationWidth -
      this.rightHangingPunctuationWidth
    );
  }

  getAdjustmentRatio(): number {
    let actualWidth = 0;
    let lineShrink = 0;
    let lineStretch = 0;
    this.itemsFiltered.forEach((item) => {
      actualWidth += item.width;
      if (item.type === 'glue') {
        lineShrink += item.shrink;
        lineStretch += item.stretch;
      }
    });
    if (actualWidth < this.idealWidth) {
      return (this.idealWidth - actualWidth) / lineStretch;
    } else {
      return Math.max(MIN_ADJUSTMENT_RATIO, (this.idealWidth - actualWidth) / lineShrink);
    }
  }

  getItemsFiltered(): InputItemType[] {
    /**
     * This goes through three steps for a reason, otherwise we
     * haven't filtered out [Penalty, Glue, Box] into [Box].
     *
     * TODO!!! Is glue visible in left-aligned??
     */
    let itemsFiltered = this.items
      .filter((item, curIndex, items) => {
        // Ignore penalty that's not at the end of the line
        return !(item.type === 'penalty' && curIndex !== items.length - 1);
      })
      // // Ignore adjacent glues TODO: should be covered by normalization
      // .filter((item, curIndex, items) => {
      //   return !(item.type === 'glue' && items[curIndex - 1]?.type === 'glue');
      // })
      .filter((item, curIndex, items) => {
        return !(
          (
            item.type === 'glue' &&
            // Ignore line-beginning glue
            curIndex === 0
          )
          //   ||
          // // Ignore line-ending glue
          // curIndex === items.length - 1
        );
      });

    /** Cleanup .TODO : Immutable */
    itemsFiltered.forEach((item) => {
      /** StripSoftHyphensFromOutputText */
      if (this.parentClass.options.stripSoftHyphensFromOutputText && 'text' in item && item.text) {
        item.text = item.text!.replaceAll(SOFT_HYPHEN, '');
      }
    });

    /**
     * Handle soft hyphens in non-justified text, see
     * comment at {@link softHyphen}.
     * Moves the soft hyphen character to before the glue.
     */
    if (this.endsWithSoftHyphen && this.items.at(-2)?.type === 'glue') {
      itemsFiltered.splice(
        itemsFiltered.length - 2,
        0,
        itemsFiltered.splice(itemsFiltered.length - 1, 1)[0],
      );
    }

    return itemsFiltered;
  }

  /**
   * Includes soft hyphens.
   * TODO: what about filtered items ???
   */
  get positionedItems(): (InputItemType & ItemPosition)[] {
    const output: (InputItemType & ItemPosition)[] = [];
    let xOffset = -this.leftHangingPunctuationWidth;
    this.itemsFiltered.forEach((item) => {
      let adjustedWidth: number;
      if (this.adjustmentRatio >= 0) {
        adjustedWidth =
          item.width + (('stretch' in item && item.stretch) || 0) * this.adjustmentRatio;
      } else {
        adjustedWidth =
          item.width + (('shrink' in item && item.shrink) || 0) * this.adjustmentRatio;
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

  get plainText() {
    return (
      this.itemsFiltered
        .map((item) => ('text' in item ? item.text : ''))
        .join('')
        // Collapse whitespace
        .replace(/\s{2,}/g, ' ')
    );
  }

  get endsWithSoftHyphen(): boolean {
    return isSoftHyphen(this.items.at(-1));
  }

  /** TODO!! Should be first box!!! */
  get leftHangingPunctuationWidth() {
    return (this.itemsFiltered[0] as TextBox)?.leftHangingPunctuationWidth || 0;
  }

  get rightHangingPunctuationWidth() {
    return (this.itemsFiltered.at(-1) as TextBox)?.rightHangingPunctuationWidth || 0;
  }

  // get glueCount(): number {
  //   return this.itemsFiltered.filter((item) => item.type === 'glue').length;
  // }

  // /** Todo: check whether gluewidth is negative before returning! */
  // get extraSpacePerGlue(): number {
  //   return (this.idealWidth - this.getActualWidth()) / this.glueCount;
  // }

  // get endsWithInfiniteGlue(): boolean {
  //   const lastItem = this.items.at(-1);
  //   return lastItem?.type === 'glue' && lastItem?.stretch === MAX_COST;
  // }

  // get glueWidth(): number {
  //   // if (this.idealWidth < this.getActualWidth({ ignoreGlue: true })) {
  //   //   console.error(`Glue in line ${this.lineIndex + 1} is negative! That's impossible`);
  //   // }
  //   // if (this.endsWithInfiniteGlue && this.extraSpacePerGlue >= 0) {
  //   //   const unstretchedGlueWidth =
  //   //     this.itemsFiltered.reduce((sum, item) => {
  //   //       if (item.type === 'glue') {
  //   //         return sum + item.width;
  //   //       }
  //   //       return sum;
  //   //     }, 0) / this.glueCount;
  //   //   return unstretchedGlueWidth;
  //   // } else {
  //   //   const width = (this.idealWidth - this.getActualWidth({ ignoreGlue: true })) / this.glueCount;
  //   //   if (this.parentClass.options.justify && this.extraSpacePerGlue >= 0) {
  //   //     return width - this.extraSpacePerGlue + this.extraSpacePerGlue / 1.5;
  //   //   } else {
  //   //     return width;
  //   //   }
  //   // }
  // }
}

export const texLinebreak = (...args: ConstructorParameters<typeof TexLinebreak>): TexLinebreak => {
  return new TexLinebreak(...args);
};
