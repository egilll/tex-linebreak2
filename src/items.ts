import { Box, Glue, Penalty } from 'src/breakLines/breakLines';
import { TexLinebreakOptions } from 'src/options';
import { glue, penalty } from 'src/utils';

export class Items2 extends Array /*<Item2>*/ {
  constructor(public options: TexLinebreakOptions) {
    super();
  }
  addTextGlue(text: string = '') {
    const spaceWidth = this.options.measureFn(' ');
    const spaceShrink = spaceWidth * this.options.glueShrinkFactor;
    const spaceStretch = spaceWidth * this.options.glueStretchFactor;
    if (this.options.justify) {
      /** Spaces in justified lines */
      return this.push(glue(spaceWidth, spaceShrink, spaceStretch, text));
    } else {
      /**
       * Spaces in ragged lines. See p. 1139.
       * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
       * (Todo: Ragged line spaces should perhaps be allowed to stretch
       * a bit, but it should probably still be listed as zero here since
       * otherwise a line with many spaces is more likely to be a good fit.)
       */
      const lineFinalStretch = 3 * spaceWidth;
      return this.push(
        glue(0, 0, lineFinalStretch, text),
        penalty(0, 0),
        glue(spaceWidth, 0, -lineFinalStretch, text),
      );
    }
  }
  get last() {
    return this[this.length - 1];
  }
}

export class Item2 {
  type!: 'box' | 'glue' | 'penalty';

  /**
   * For boxes, this is the amount of space required by the content.
   * For glues, this is the preferred width.
   */
  width!: number;

  /** Values for hanging punctuation. */
  rightHangingPunctuationWidth?: number;
  leftHangingPunctuationWidth?: number;

  /**
   * Maximum amount by which this space can grow (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `stretch` of 1 means that the glue can have
   * a width of 6. A value of 0 means that it cannot stretch.
   */
  stretch?: number;
  /**
   * Maximum amount by which this space can shrink (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `shrink` of 1 means that the glue can have a
   * width of 4. A value of 0 means that it cannot shrink.
   */
  shrink?: number;
  /**
   * The undesirability of breaking the line at this point.
   * Values <= `MIN_COST` and >= `MAX_COST` mandate or
   * prevent breakpoints respectively.
   */
  cost?: number;
  /**
   * A hint used to prevent successive lines being broken
   * with hyphens. The layout algorithm will try to avoid
   * successive lines being broken at flagged `Penalty` items.
   */
  flagged?: boolean;

  get isPenalty() {
    return this.type === 'penalty';
  }

  // get isForcedBreak() {
  //
  //   // items[index + 1].type === 'penalty' &&
  //   // (items[index + 1] as Penalty).cost! > MIN_COST,
  // }

  constructor(item: Box | Glue | Penalty) {
    Object.assign(this, item);
  }
}
