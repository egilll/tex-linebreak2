import { MAX_COST, MIN_COST } from 'src/breakLines/breakLines';
import { DOMItem, DomOffset } from 'src/html/getItemsFromDOM';
import { TexLinebreakOptions } from 'src/options';
import { PenaltyClasses } from 'src/splitTextIntoItems/penalty';
import { box, glue, penalty, TextItem } from 'src/utils';

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

/** An array containing items. */
export class Items extends Array<Item> {
  constructor(public options: TexLinebreakOptions) {
    super();
  }
  add(itemData: Box | Glue | Penalty | TextItem | DOMItem) {
    this.push(new Item(itemData, this));
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
  validate() {
    /** Input has to end in a MIN_COST penalty */
    if (!this.last?.isForcedBreak) {
      throw new Error(
        "The last item in breakLines must be a penalty of MIN_COST, otherwise the last line will not be broken. `splitTextIntoItems` will automatically as long as the `addParagraphEnd` option hasn't been turned off.",
      );
    }
    /** A glue cannot be followed by a non-MIN_COST penalty */
    if (this.some((item) => item.isGlue && item.next?.isPenaltyThatDoesNotForceBreak)) {
      throw new Error(
        "A glue cannot be followed by a penalty with a cost greater than MIN_COST. If you're trying to penalize a glue, make the penalty come before it.",
      );
    }
  }
  get last(): Item | undefined {
    return this[this.length - 1];
  }
}

/** A wrapper around boxes, glue, and penalties. */
export class Item<T = Box | Glue | Penalty> {
  constructor(input: T, public parentArray: Items) {
    Object.assign(this, input);
    this.#index = parentArray.length;
  }

  type!: 'box' | 'glue' | 'penalty';

  /**
   * For boxes, this is the amount of space required by the content.
   * For glues, this is the preferred width.
   * For penalties, this is the amount of space required for typeset
   * content to be added (eg. a hyphen) if a line is broken here.
   */
  width!: number;

  stretch: Glue['stretch'] = 0;
  shrink: Glue['shrink'] = 0;
  cost: Penalty['cost'] = 0;
  flagged?: Penalty['flagged'];

  /** Values for hanging punctuation. Only used by boxes. */
  rightHangingPunctuationWidth?: number;
  leftHangingPunctuationWidth?: number;

  text: string = '';
  domOffset?: DomOffset;

  get isBox() {
    return this.type === 'box';
  }

  get isGlue() {
    return this.type === 'glue';
  }

  get isPenalty() {
    return this.type === 'penalty';
  }

  get isForcedBreak() {
    return this.type === 'penalty' && this.cost <= MIN_COST;
  }

  get isBreakablePenalty() {
    return this.type === 'penalty' && this.cost < MAX_COST;
  }

  get isPenaltyThatDoesNotForceBreak() {
    return this.type === 'penalty' && this.cost > MIN_COST;
  }

  get isSoftHyphen() {
    return this.type === 'penalty' && this.flagged && this.width > 0;
  }

  get prev(): Item | undefined {
    return this.parentArray[this.index - 1];
  }

  get next(): Item | undefined {
    return this.parentArray[this.index + 1];
  }

  /**
   * It may be useful to have an item's index be dynamic
   * since items may be merged or split. Cached since
   * `this.parentArray.indexOf(this)` may be expensive
   */
  get index(): number {
    if (this.#index != null && this.parentArray[this.#index] === this) {
      return this.#index;
    } else {
      return (this.#index = this.parentArray.indexOf(this));
    }
  }
  #index?: number;

  /** Get the nearest previous item that matches a predicate. */
  getPrevMatching(
    callbackFn: (item: Item) => boolean,
    options: { minIndex?: number },
  ): Item | undefined {
    for (let j = this.index - 1; j >= (options.minIndex || 0); j--) {
      const item = this.parentArray[j];
      if (callbackFn(item)) return item;
    }
    return undefined;
  }

  /** Get the next item that matches a predicate. */
  getNextMatching(
    callbackFn: (item: Item) => boolean,
    options: { maxIndex?: number },
  ): Item | undefined {
    for (let j = this.index + 1; j <= (options.maxIndex || this.parentArray.length); j++) {
      const item = this.parentArray[j];
      if (callbackFn(item)) return item;
    }
    return undefined;
  }
}
