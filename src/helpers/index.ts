import {
  TexLinebreakOptions,
  getOptionsWithDefaults,
  RequireCertainKeys,
} from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';
import { TextItem, isSoftHyphen, TextBox } from 'src/helpers/util';
import { breakLines, Item, MAX_COST, getLineWidth } from 'src/breakLines';
import { breakLinesGreedy } from 'src/helpers/greedy';
import { DOMItem } from 'src/html/getItemsFromDOM';

export class TexLinebreak<
  InputItemType extends TextItem | DOMItem | Item = TextItem | DOMItem | Item,
> {
  items: InputItemType[];
  constructor(
    input: string | InputItemType[],
    public options: RequireCertainKeys<TexLinebreakOptions, 'lineWidth' | 'measureFn'>,
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
      return breakLines(this.items, this.options.lineWidth);
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
  itemsFiltered: InputItemType[];
  constructor(
    public parentClass: TexLinebreak<any>,
    public startBreakpoint: number,
    public endBreakpoint: number,
    public lineIndex: number,
  ) {
    this.items = parentClass.items.slice(this.startBreakpoint, this.endBreakpoint);

    /**
     * Filter glues and penalties that do not matter for the
     * purposes of rendering this line.
     * This goes through three steps for a reason, otherwise we
     * haven't filtered out [Penalty, Glue, Box] into [Box].
     */
    this.itemsFiltered = this.items
      // Ignore penalty that's not at the end of the line
      .filter((item, curIndex, items) => {
        return !(item.type === 'penalty' && curIndex !== items.length - 1);
      })
      // Ignore adjacent glues
      .filter((item, curIndex, items) => {
        return !(item.type === 'glue' && items[curIndex - 1]?.type === 'glue');
      })
      .filter((item, curIndex, items) => {
        return !(
          item.type === 'glue' &&
          // Ignore line-beginning glue
          (curIndex === 0 ||
            // Ignore line-ending glue
            curIndex === items.length - 1)
        );
      });
  }

  get endsWithSoftHyphen(): boolean {
    return isSoftHyphen(this.parentClass.items[this.endBreakpoint]);
  }

  get idealWidth(): number {
    return getLineWidth(this.parentClass.options.lineWidth!, this.lineIndex);
  }

  getActualWidth(options?: { ignoreGlue: boolean }): number {
    return (
      this.itemsFiltered.reduce((sum, item) => {
        if (options?.ignoreGlue && item.type === 'glue') return sum;
        return sum + item.width;
      }, 0) -
      this.leftHangingPunctuationWidth -
      this.rightHangingPunctuationWidth
    );
  }

  get leftHangingPunctuationWidth() {
    return (this.itemsFiltered[0] as TextBox)?.leftHangingPunctuationWidth || 0;
  }

  get rightHangingPunctuationWidth() {
    return (this.itemsFiltered.at(-1) as TextBox)?.rightHangingPunctuationWidth || 0;
  }

  get glueCount(): number {
    return this.itemsFiltered.filter((item) => item.type === 'glue').length;
  }

  get extraSpacePerGlue(): number {
    return (this.idealWidth - this.getActualWidth()) / this.glueCount;
  }

  get unstretchedGlueWidth(): number {
    return (
      this.itemsFiltered.reduce((sum, item) => {
        if (item.type === 'glue') {
          return sum + item.width;
        }
        return sum;
      }, 0) / this.glueCount
    );
  }

  get endsWithInfiniteGlue(): boolean {
    const lastItem = this.items.at(-1);
    return lastItem?.type === 'glue' && lastItem?.stretch === MAX_COST;
  }

  get glueWidth(): number {
    if (this.idealWidth < this.getActualWidth({ ignoreGlue: true })) {
      console.error(`Glue in line ${this.lineIndex + 1} is negative! That's impossible`);
    }
    if (this.endsWithInfiniteGlue && this.extraSpacePerGlue >= 0) {
      return this.unstretchedGlueWidth;
    } else {
      const width = (this.idealWidth - this.getActualWidth({ ignoreGlue: true })) / this.glueCount;
      if (this.parentClass.options.alignment === 'left' && this.extraSpacePerGlue >= 0) {
        return width - this.extraSpacePerGlue + this.extraSpacePerGlue / 1.5;
      } else {
        return width;
      }
    }
  }

  /**
   * Includes soft hyphens.
   * TODO: what about filtered items ???
   */
  get positionedItems(): (InputItemType & { xOffset: number })[] {
    const result: (InputItemType & { xOffset: number })[] = [];
    let xOffset = -this.leftHangingPunctuationWidth;
    this.itemsFiltered.forEach((item) => {
      result.push({
        ...item,
        xOffset,
      });
      if (item.type === 'glue') {
        xOffset += this.glueWidth;
      } else {
        xOffset += item.width;
      }
    });

    return result;
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
}

export const texLinebreak = (...args: ConstructorParameters<typeof TexLinebreak>): TexLinebreak => {
  return new TexLinebreak(...args);
};
