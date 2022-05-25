import { HelperOptions, getOptionsWithDefaults } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems';
import { TextInputItem } from 'src/helpers/util';
import { breakLines } from 'src/breakLines';
import { positionItems, PositionedItem, PositionOptions } from 'src/helpers/positionItems';
import { breakLinesGreedy } from 'src/helpers/greedy';

export class TexLinebreak {
  public options: HelperOptions;
  private _items?: TextInputItem[];
  constructor(options: HelperOptions) {
    this.options = getOptionsWithDefaults(options);
  }
  getItems(): TextInputItem[] {
    if (!this._items) {
      if (typeof this.options.text === 'string') {
        this._items = splitTextIntoItems(this.options.text, this);
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
  getItemsByLine(): TextInputItem[][] {
    let lines: TextInputItem[][] = [];
    const breakpoints = this.getBreakpoints();
    const items = this.getItems();
    for (let b = 0; b < breakpoints.length - 1; b++) {
      lines.push(items.slice(breakpoints[b], breakpoints[b + 1]));
    }
    return lines;
  }
  getPlainTextLines(): string[] {
    return this.getItemsByLine().map((line) =>
      line
        .map((item) => ('text' in item ? item.text : ''))
        .join('')
        // Todo: This has to be reconsidered, only breakable glue at the start of lines should be ignored
        .trim(),
    );
  }
  getPlainText(): string {
    return this.getPlainTextLines().join('\n');
  }
  getPositionedItems(options: PositionOptions = {}): PositionedItem[] {
    if (!this.options.lineWidth) throw new Error('The option `lineWidth` is required');
    return positionItems(this.getItems(), this.options.lineWidth, this.getBreakpoints(), options);
  }
}

// export const texLinebreak = (options: HelperOptions): TexLinebreak => {
//   return new TexLinebreak(options);
// };
