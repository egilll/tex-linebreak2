import { HelperOptions, helperOptionsDefaults } from 'src/helpers/options';
import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems';
import { TextInputItem } from 'src/helpers/util';
import { breakLines } from 'src/breakLines';
import { positionItems, PositionedItem, PositionOptions } from 'src/helpers/positionItems';

export class TexLinebreak {
  options: HelperOptions;
  #items?: TextInputItem[];
  constructor(options: HelperOptions) {
    this.options = { ...helperOptionsDefaults, ...options };
  }
  getItems(): TextInputItem[] {
    if (!this.#items) {
      if (this.options.text) {
        this.#items = splitTextIntoItems(this.options.text, this);
      } else {
        throw new Error('Not implemented');
      }
    }
    return this.#items;
  }
  getBreakpoints(): number[] {
    return breakLines(this.getItems(), this.options.lineWidth);
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
  getPlainTextLines() {}
  getPlainText() {}
  getPositionedItems(options: PositionOptions = {}): PositionedItem[] {
    return positionItems(this.getItems(), this.options.lineWidth, this.getBreakpoints(), options);
  }
}

// export const texLinebreak = (options: HelperOptions): TexLinebreak => {
//   return new TexLinebreak(options);
// };
