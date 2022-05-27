import { HelperOptions, getOptionsWithDefaults } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems';
import { TextInputItem, isSoftHyphen } from 'src/helpers/util';
import { breakLines, InputItem } from 'src/breakLines';
import { breakLinesGreedy } from 'src/helpers/greedy';
import { DOMItem } from 'src/html/htmlHelpers';

export type AnyInput = TextInputItem | DOMItem | InputItem;

export class TexLinebreak<InputItemType extends AnyInput = AnyInput> {
  private _items?: InputItemType[];
  constructor(public options: HelperOptions) {
    this.options = getOptionsWithDefaults(options);
  }
  getItems(): InputItemType[] {
    if (this.options.items) {
      this._items = this.options.items as InputItemType[];
    } else if (!this._items) {
      if (typeof this.options.text === 'string') {
        this._items = splitTextIntoItems(this.options.text, this.options) as InputItemType[];
      } else {
        throw new Error('Not implemented');
      }
    }
    return this._items;
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
    return this.lines.map((line) => line.plaintext);
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
   * Filter glues and penalties that do not matter for the purposes of rendering this line
   */
  get itemsFiltered() {
    /**
     * This goes through three steps for a reason, otherwise we haven't filtered out
     * [Penalty, Glue, Box] into [Box].
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
    return this.parentClass.getItems()[this.endBreakpoint];
  }
  get prevBreakItem() {
    return this.parentClass.getItems()[this.startBreakpoint - 1];
  }
  get endsWithSoftHyphen(): boolean {
    return isSoftHyphen(this.breakItem);
  }

  /** TODO: Work with multiple lines */
  get idealWidth(): number {
    if (!this.parentClass.options.lineWidth) {
      throw new Error('The option `lineWidth` is required');
    }
    return this.parentClass.options.lineWidth;
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

  get glueWidth(): number {
    if (this.idealWidth < this.actualWidthIgnoringGlue) {
      console.error(`Glue in line ${this.lineNumber} is negative!! That's impossible`);
    }
    return (this.idealWidth - this.actualWidthIgnoringGlue) / this.glueCount;
  }

  /**
   * Includes soft hyphens.
   * TODO:   what about filtered items ???
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
  get plaintext() {
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
