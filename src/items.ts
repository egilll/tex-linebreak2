import { MIN_COST } from 'src/breakLines/breakLines';
import { RequireOnlyCertainKeys, TexLinebreakOptions } from 'src/options';
import { PenaltyClasses } from 'src/splitTextIntoItems/penalty';
import { box, glue, penalty } from 'src/utils';

/** An object (eg. a word) to be typeset. */
export interface Box {
  type: 'box';
  /** Amount of space required by this content. Must be >= 0. */
  width: number;

  /** Values for hanging punctuation. */
  rightHangingPunctuationWidth?: number;
  leftHangingPunctuationWidth?: number;
}

/**
 * A space between `Box` items with a preferred width
 * and some capacity to stretch or shrink.
 *
 * `Glue` items are also candidates for breakpoints
 * if they immediately follow a `Box`. // TODO: Check
 */
export interface Glue {
  type: 'glue';
  /** Preferred width of this space. */
  width: number;
  /**
   * Maximum amount by which this space can grow (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `stretch` of 1 means that the glue can have
   * a width of 6. A value of 0 means that it cannot stretch.
   */
  stretch: number;
  /**
   * Maximum amount by which this space can shrink (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `shrink` of 1 means that the glue can have a
   * width of 4. A value of 0 means that it cannot shrink.
   */
  shrink: number;
}

/** An explicit candidate position for breaking a line. */
export interface Penalty {
  type: 'penalty';

  /**
   * Amount of space required for typeset content to be added
   * (eg. a hyphen) if a line is broken here. Must be >= 0.
   */
  width: number;
  /**
   * The undesirability of breaking the line at this point.
   * Values <= `MIN_COST` and >= `MAX_COST` mandate or
   * prevent breakpoints respectively.
   */
  cost: number;
  /**
   * A hint used to prevent successive lines being broken
   * with hyphens. The layout algorithm will try to avoid
   * successive lines being broken at flagged `Penalty` items.
   */
  flagged?: boolean;
}

export class Items extends Array<Item> {
  constructor(public options: TexLinebreakOptions) {
    super();
  }
  add(itemData: Box | Glue | Penalty) {
    if(itemData.type==='box'){
    this.push(new Box2(itemData, this));
    } else if (itemData.type==='glue'){
    this.push(new Glue2(itemData, this));
    } else if (itemData.type==='penalty'){
    this.push(new Penalty2(itemData, this));
    }
  }
  addTextBox(text: string) {
    this.add(box(this.options.measureFn(text), text));
  }
  addTextGlue(text: string = '') {
    const spaceWidth = this.options.measureFn(' ');
    const spaceShrink = spaceWidth * this.options.glueShrinkFactor;
    const spaceStretch = spaceWidth * this.options.glueStretchFactor;
    if (this.options.justify) {
      /** Spaces in justified lines */
      this.add(glue(spaceWidth, spaceShrink, spaceStretch, text));
    } else {
      /**
       * Spaces in ragged lines. See p. 1139.
       * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=21
       * (Todo: Ragged line spaces should perhaps be allowed to stretch
       * a bit, but it should probably still be listed as zero here since
       * otherwise a line with many spaces is more likely to be a good fit.)
       */
      const lineFinalStretch = 3 * spaceWidth;
      this.add(glue(0, 0, lineFinalStretch, text));
      this.add(penalty(0, 0));
      this.add(glue(spaceWidth, 0, -lineFinalStretch, text));
    }
  }
  addForcedBreak() {
    this.add(penalty(0, MIN_COST));
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
    this.add(
      penalty(hyphenWidth, this.options.softHyphenPenalty ?? PenaltyClasses.SoftHyphen, true),
    );
  }
  get last(): Item | undefined {
    return this[this.length - 1];
  }
}

/** A wrapper around boxes, glue, and penalties. */
export class BaseItem {
  constructor(public values: Partial<Box2|Glue2|Penalty2>, public parentArray: Items) {}

  // /** Value getters */
  //
  // get type(): T['type'] {
  //   return this.values.type;
  // }
  //
  // get width() {
  //   return this.values.width;
  // }
  //
  // get stretch(): Glue['stretch'] | null {
  //   return this.values.type === 'glue' ? this.values.stretch : null;
  // }
  //
  // get shrink(): Glue['shrink'] | null {
  //   return 'shrink' in this.values ? this.values.shrink : null;
  // }
  //
  // get cost(): Penalty['cost'] | null {
  //   return 'cost' in this.values ? this.values.cost : null;
  // }
  //
  // get flagged(): Penalty['flagged'] | null {
  //   return 'flagged' in this.values ? this.values.flagged : null;
  // }
  //
  // get rightHangingPunctuationWidth(): Box['rightHangingPunctuationWidth'] | undefined {
  //   return this.values.type === 'box' ? this.values.rightHangingPunctuationWidth : undefined;
  // }
  //
  // get leftHangingPunctuationWidth(): Box['leftHangingPunctuationWidth'] | undefined {
  //   return this.values.type === 'box' ? this.values.leftHangingPunctuationWidth : undefined;
  // }

  /** Helper functions */

  get isBox() {
    return this.values.type === 'box';
  }

  get isGlue() {
    return this.values.type === 'glue';
  }

  get isPenalty() {
    return this.values.type === 'penalty';
  }

  get isForcedBreak() {
    return this.values.type === 'penalty' && this.values.cost <= MIN_COST;
  }

  get isPenaltyThatDoesNotForceBreak() {
    return this.values.type === 'penalty' && this.values.cost > MIN_COST;
  }

  get isSoftHyphen() {
    return this.values.type === 'penalty' && this.values.flagged && this.values.width > 0;
  }

  get prev(): Item | undefined {
    return this.parentArray[this.parentArray.indexOf(this) - 1];
  }

  get next(): Item | undefined {
    return this.parentArray[this.parentArray.indexOf(this) + 1];
  }
}

export type Item = Box2| Glue2 | Penalty2;



export class Glue2 extends BaseItem {
  type = 'glue';

  /** Preferred width of this space. */
  width: number;

  /**
   * Maximum amount by which this space can grow (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `stretch` of 1 means that the glue can have
   * a width of 6. A value of 0 means that it cannot stretch.
   */
  stretch: number;

  /**
   * Maximum amount by which this space can shrink (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `shrink` of 1 means that the glue can have a
   * width of 4. A value of 0 means that it cannot shrink.
   */
  shrink: number;
  constructor(values: RequireOnlyCertainKeys<Glue2, 'width' | 'stretch' | 'shrink'>, parentArray: Items) {
    super(values, parentArray);
    this.width = values.width
    this.stretch = values.stretch
    this.shrink = values.shrink
  }
}

export class Box2 extends BaseItem {
  type = 'box';
  /** Amount of space required by this content. Must be >= 0. */
  width: number;

  /** Values for hanging punctuation. */
  rightHangingPunctuationWidth?: number;
  leftHangingPunctuationWidth?: number;
  constructor(values: RequireOnlyCertainKeys<Box2, 'width'>, parentArray: Items) {
      super(values, parentArray)
    this.width=values.width
    this.rightHangingPunctuationWidth=values.rightHangingPunctuationWidth
    this.leftHangingPunctuationWidth=values.leftHangingPunctuationWidth
  }
}

/** An explicit candidate position for breaking a line. */
export class Penalty2 extends BaseItem {

type='penalty';
  /**
   * Amount of space required for typeset content to be added
   * (eg. a hyphen) if a line is broken here. Must be >= 0.
   */
  width: number;

  /**
   * The undesirability of breaking the line at this point.
   * Values <= `MIN_COST` and >= `MAX_COST` mandate or
   * prevent breakpoints respectively.
   */
  cost: number;

  /**
   * A hint used to prevent successive lines being broken
   * with hyphens. The layout algorithm will try to avoid
   * successive lines being broken at flagged `Penalty` items.
   */
  flagged?: boolean;

  constructor(values: RequireOnlyCertainKeys<Penalty2, 'width' | 'cost'>, parentArray: Items) {
      super(values, parentArray)
    this.width = values.width
    this.cost = values.cost
    this.flagged = values.flagged
}

export const glue2 = (width: number, shrink: number, stretch: number, text?: string) => {
  // return new Glue2({
  //   width,
  //   shrink,
  //   stretch,
  //   text,
  // });
};
