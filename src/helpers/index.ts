import { HelperOptions, getOptionsWithDefaults } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems';
import { TextInputItem } from 'src/helpers/util';
import { breakLines, InputItem } from 'src/breakLines';
import { positionItems, PositionedItem, PositionOptions } from 'src/helpers/positionItems';
import { breakLinesGreedy } from 'src/helpers/greedy';
import { DOMItem } from 'src/html/html';

export type AnyInputItem = TextInputItem | DOMItem | InputItem;

export class TexLinebreak<InputItemType extends TextInputItem | DOMItem | InputItem> {
  public options: HelperOptions;
  private _items?: InputItemType[];
  constructor(options: HelperOptions) {
    this.options = getOptionsWithDefaults(options);
  }
  getItems(): InputItemType[] {
    if (this.options.items) {
      return this.options.items as InputItemType[];
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
  getLines(): Line[] {
    let lines: Line[] = [];
    const breakpoints = this.getBreakpoints();
    // const items = this.getItems();
    for (let b = 0; b < breakpoints.length - 1; b++) {
      lines.push(new Line(this, breakpoints[b], breakpoints[b + 1]));
    }
    return lines;
  }
  getLinesAsPlainText(): string[] {
    return this.getLines().map((line) =>
      line.items
        .map((item) => ('text' in item ? item.text : ''))
        .join('')
        // Todo: This has to be reconsidered, only breakable glue at the start of lines should be ignored
        .trim(),
    );
  }
  getPlainText(): string {
    return this.getLinesAsPlainText().join('\n');
  }
  getPositionedItems(options: PositionOptions = {}): PositionedItem[] {
    if (!this.options.lineWidth) throw new Error('The option `lineWidth` is required');
    return positionItems(this.getItems(), this.options.lineWidth, this.getBreakpoints(), options);
  }
}

export class Line {
  constructor(
    public parentClass: TexLinebreak,
    public startBreakpoint: number,
    public endBreakpoint: number,
  ) {}
  get items() {
    return this.parentClass.getItems().slice(this.startBreakpoint, this.endBreakpoint);
  }
  get breakItem() {
    return this.items[this.endBreakpoint];
  }
  get prevBreakItem() {
    return this.items[this.startBreakpoint - 1];
  }
  get endsWithSoftHyphen() {
    return this.breakItem.type === 'penalty' && this.breakItem.flagged && this.breakItem.width > 0;
  }
}

// export const texLinebreak = (options: HelperOptions): TexLinebreak => {
//   return new TexLinebreak(options);
// };
