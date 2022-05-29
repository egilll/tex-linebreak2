import { TexLinebreakOptions, getOptionsWithDefaults } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';
import { TextItem, isSoftHyphen } from 'src/helpers/util';
import { breakLines, Item, MAX_COST, getLineWidth } from 'src/breakLines';
import { breakLinesGreedy } from 'src/helpers/greedy';
import { DOMItem } from 'src/html/getItemsFromDOM';

export type AnyInput = TextItem | DOMItem | Item;

export class TexLinebreak<InputItemType extends AnyInput = AnyInput> {
  items: InputItemType[];
  constructor(input: string | InputItemType[], public options: TexLinebreakOptions) {
    this.options = getOptionsWithDefaults(options);
    if (typeof input === 'string') {
      this.items = splitTextIntoItems(input, this.options) as InputItemType[];
      console.log(this.items);
    } else {
      this.items = input;
    }
  }
  getItems() {
    return this.items;
  }
  getBreakpoints(): number[] {
    if (!this.options.lineWidth) throw new Error('The option `lineWidth` is required');
    if (this.options.lineBreakingType === 'greedy') {
      return breakLinesGreedy(this.getItems(), this.options.lineWidth);
    } else {
      return breakLines(this.getItems(), this.options.lineWidth);
    }
  }
  get lines(): Line<InputItemType>[] {
    let lines: Line<InputItemType>[] = [];
    const breakpoints = this.getBreakpoints();
    for (let b = 0; b < breakpoints.length - 1; b++) {
      lines.push(new Line<InputItemType>(this, breakpoints[b], breakpoints[b + 1], b));
    }
    return lines;
  }
  getLinesAsPlainText(): string[] {
    return this.lines.map((line) => line.plainText);
  }
  getPlainText(): string {
    return this.getLinesAsPlainText().join('\n');
  }
}

export class Line<InputItemType extends AnyInput = AnyInput> {
  constructor(
    public parentClass: TexLinebreak<any>,
    public startBreakpoint: number,
    public endBreakpoint: number,
    public lineIndex: number,
  ) {}

  get lineNumber(): number {
    return this.lineIndex + 1;
  }

  get items() {
    return this.parentClass.getItems().slice(this.startBreakpoint, this.endBreakpoint);
  }

  /**
   * Filter glues and penalties that do not matter
   * for the purposes of rendering this line
   */
  get itemsFiltered() {
    /**
     * This goes through three steps for a reason, otherwise we
     * haven't filtered out [Penalty, Glue, Box] into [Box].
     */
    return (
      this.items
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
        })
    );
  }
  get breakItem() {
    // return this.itemsFiltered.at(-1);
    return this.parentClass.getItems()[this.endBreakpoint];
  }
  get prevBreakItem() {
    return this.parentClass.getItems()[this.startBreakpoint - 1];
  }
  get endsWithSoftHyphen(): boolean {
    return isSoftHyphen(this.breakItem);
  }

  get idealWidth(): number {
    if (!this.parentClass.options.lineWidth) {
      throw new Error('The option `lineWidth` is required');
    }
    return getLineWidth(this.parentClass.options.lineWidth, this.lineIndex);
  }
  get actualWidth(): number {
    return (
      this.itemsFiltered.reduce((sum, item, curIndex, items) => {
        return sum + item.width;
      }, 0) -
      this.leftHangingPunctuationWidth -
      this.rightHangingPunctuationWidth
    );
  }
  //todo:Merge
  get actualWidthIgnoringGlue(): number {
    return (
      this.itemsFiltered.reduce((sum, item, curIndex, items) => {
        if (item.type === 'glue') return sum;
        return sum + item.width;
      }, 0) -
      this.leftHangingPunctuationWidth -
      this.rightHangingPunctuationWidth
    );
  }

  get leftHangingPunctuationWidth() {
    return this.itemsFiltered[0]?.leftHangingPunctuationWidth || 0;
  }

  get rightHangingPunctuationWidth() {
    return this.itemsFiltered[this.itemsFiltered.length - 1]?.rightHangingPunctuationWidth || 0;
  }

  get glueCount(): number {
    return this.itemsFiltered.filter((item) => item.type === 'glue').length;
  }

  get extraSpacePerGlue(): number {
    return (this.idealWidth - this.actualWidth) / this.glueCount;
  }

  get actualAverageGlueWidth(): number {
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
    return this.items[this.items.length - 1]?.stretch === MAX_COST;
  }

  get glueWidth(): number {
    if (this.idealWidth < this.actualWidthIgnoringGlue) {
      console.error(`Glue in line ${this.lineNumber} is negative! That's impossible`);
    }
    if (this.endsWithInfiniteGlue && this.extraSpacePerGlue >= 0) {
      return this.actualAverageGlueWidth;
    } else {
      const width = (this.idealWidth - this.actualWidthIgnoringGlue) / this.glueCount;
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
      this.items
        .map((item) => ('text' in item ? item.text : ''))
        .join('')
        // Collapse whitespace
        .replace(/\s{2,}/g, ' ')
        // Todo: This has to be reconsidered, only breakable glue at the start of lines should be ignored
        .trim()
    );
  }
}
