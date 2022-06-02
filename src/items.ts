import { Box, Glue, MIN_COST, Penalty } from 'src/breakLines/breakLines';
import { TexLinebreakOptions } from 'src/options';
import { PenaltyClasses } from 'src/splitTextIntoItems/penalty';
import { box, glue, penalty } from 'src/utils';

export class Items2 extends Array<Item2> {
  constructor(public options: TexLinebreakOptions) {
    super();
  }
  add(item: Box | Glue | Penalty) {
    this.push(new Item2(item, this));
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
  get last() {
    return this[this.length - 1];
  }
}

/** A wrapper around boxes, glue, and penalties. */
export class Item2 {
  constructor(public values: Box | Glue | Penalty, public parentArray: Items2) {}

  /** Value getters */

  get type() {
    return this.values.type;
  }
  get width() {
    return this.values.width;
  }
  get stretch(): Glue['stretch'] | null {
    return this.values.type === 'glue' ? this.values.stretch : null;
  }
  get shrink(): Glue['shrink'] | null {
    return 'shrink' in this.values ? this.values.shrink : null;
  }
  get cost(): Penalty['cost'] | null {
    return 'cost' in this.values ? this.values.cost : null;
  }
  get flagged(): Penalty['flagged'] | null {
    return 'flagged' in this.values ? this.values.flagged : null;
  }
  get rightHangingPunctuationWidth(): Box['rightHangingPunctuationWidth'] | undefined {
    return this.values.type === 'box' ? this.values.rightHangingPunctuationWidth : undefined;
  }
  get leftHangingPunctuationWidth(): Box['leftHangingPunctuationWidth'] | undefined {
    return this.values.type === 'box' ? this.values.leftHangingPunctuationWidth : undefined;
  }

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
    return this.values.type === 'penalty' && this.values.cost! > MIN_COST;
  }

  get isSoftHyphen() {
    return this.values.type === 'penalty' && this.values.flagged && this.values.width > 0;
  }

  get next() {
    //hmm..
    return this.parentArray[this.parentArray.indexOf(this) + 1];
  }
}

export const glue2 = (width: number, shrink: number, stretch: number, text?: string) => {
  // return new Glue2({
  //   width,
  //   shrink,
  //   stretch,
  //   text,
  // });
};
