import { MIN_COST } from 'src/breakLines/breakLines';
import { RequireOnlyCertainKeys, TexLinebreakOptions } from 'src/options';
import { PenaltyClasses } from 'src/splitTextIntoItems/penalty';
import { box, glue, penalty } from 'src/utils';

export class Items2 extends Array /*<Item2>*/ {
  constructor(public options: TexLinebreakOptions) {
    super();
  }
  addTextBox(text: string) {
    this.push(box(this.options.measureFn(text), text));
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
  addForcedBreak() {
    this.push(penalty(0, MIN_COST));
  }
  /**
   * Todo: Optional hyphenations in unjustified text, p 1139. Slightly
   * tricky as:
   * "After the breakpoints have been chosen using the above sequences
   * for spaces and for optional hyphens, the individual lines
   * should not actually be justified, since a hyphen inserted by the
   * ‘penalty(6,500,1)’ would otherwise appear at the right margin."
   */
  addSoftHyphen() {
    const hyphenWidth = this.options.hangingPunctuation ? 0 : this.options.measureFn('-');
    this.push(
      penalty(hyphenWidth, this.options.softHyphenPenalty ?? PenaltyClasses.SoftHyphen, true),
    );
  }
  get last() {
    return this[this.length - 1];
  }
}

export class Item2 {
  // /** Values for hanging punctuation. Only used by boxes. */
  // rightHangingPunctuationWidth?: T extends 'box' ? number : undefined;
  // leftHangingPunctuationWidth?: T extends 'box' ? number : undefined;
  //
  // /**
  //  * Used by glues.
  //  *
  //  * Maximum amount by which this space can grow (given a
  //  * maxAdjustmentRatio of 1), expressed in the same units as `width`.
  //  * A `width` of 5 and a `stretch` of 1 means that the glue can have
  //  * a width of 6. A value of 0 means that it cannot stretch.
  //  */
  // stretch?: number;
  //
  // /**
  //  * Used by glues.
  //  *
  //  * Maximum amount by which this space can shrink (given a
  //  * maxAdjustmentRatio of 1), expressed in the same units as `width`.
  //  * A `width` of 5 and a `shrink` of 1 means that the glue can have a
  //  * width of 4. A value of 0 means that it cannot shrink.
  //  */
  // shrink?: number;
  //
  // /**
  //  * Used by penalties.
  //  *
  //  * The undesirability of breaking the line at this point.
  //  * Values <= `MIN_COST` and >= `MAX_COST` mandate or
  //  * prevent breakpoints respectively.
  //  */
  // cost?: number;
  //
  // /**
  //  * Used by penalties.
  //  *
  //  * A hint used to prevent successive lines being broken
  //  * with hyphens. The layout algorithm will try to avoid
  //  * successive lines being broken at flagged `Penalty` items.
  //  */
  // flagged?: boolean;
  //
  // get isBox() {
  //   return this.type === 'box';
  // }
  // get isGlue() {
  //   return this.type === 'glue';
  // }
  // get isPenalty() {
  //   return this.type === 'penalty';
  // }
  //
  get isForcedBreak() {
    return this.type === 'penalty' && this.cost! > MIN_COST;
  }
  //
  // get isSoftHyphen() {
  //   return this.type === 'penalty' && this.flagged && this.width > 0;
  // }

  text?: string;

  constructor(values: Partial<Item2>) {
    Object.assign(this, values);
  }
}

export class Glue2 extends Item2 {
  type = 'glue';
  /** Preferred width of this space. */
  width!: number;
  /**
   * Maximum amount by which this space can grow (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `stretch` of 1 means that the glue can have
   * a width of 6. A value of 0 means that it cannot stretch.
   */
  stretch!: number;

  /**
   * Maximum amount by which this space can shrink (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `shrink` of 1 means that the glue can have a
   * width of 4. A value of 0 means that it cannot shrink.
   */
  shrink!: number;
  constructor(values: RequireOnlyCertainKeys<Glue2, 'width' | 'stretch' | 'shrink'>) {
    super(values);
    Object.assign(this, values);
  }
}

export class Box2 extends Item2 {
  type = 'box';
  /** Amount of space required by this content. Must be >= 0. */
  width!: number;

  /** Values for hanging punctuation. */
  rightHangingPunctuationWidth?: number;
  leftHangingPunctuationWidth?: number;
  constructor(values: RequireOnlyCertainKeys<Box2, 'width'>) {
    super(values);
    Object.assign(this, values);
  }
}

/** An explicit candidate position for breaking a line. */
export class Penalty2 extends Item2 {
  type = 'penalty';

  /**
   * Amount of space required for typeset content to be added
   * (eg. a hyphen) if a line is broken here. Must be >= 0.
   */
  width!: number;
  /**
   * The undesirability of breaking the line at this point.
   * Values <= `MIN_COST` and >= `MAX_COST` mandate or
   * prevent breakpoints respectively.
   */
  cost!: number;
  /**
   * A hint used to prevent successive lines being broken
   * with hyphens. The layout algorithm will try to avoid
   * successive lines being broken at flagged `Penalty` items.
   */
  flagged?: boolean;

  constructor(values: RequireOnlyCertainKeys<Penalty2, 'width' | 'cost'>) {
    super(values);
    Object.assign(this, values);
  }
}

export const glue2 = (width: number, shrink: number, stretch: number, text?: string) => {
  return new Glue2({
    width,
    shrink,
    stretch,
    text,
  });
};
