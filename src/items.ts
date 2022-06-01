import { Box, Glue, MIN_COST, Penalty } from 'src/breakLines/breakLines';
import { TexLinebreakOptions } from 'src/options';
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
  addSoftHyphen() {
    const hyphenWidth = this.options.hangingPunctuation ? 0 : this.options.measureFn('-');
    this.push(
      penalty(hyphenWidth, this.options.softHyphenPenalty ?? PenaltyClasses.SoftHyphen, true),
    );
    /**
     * Todo: Optional hyphenations in unjustified text, p 1139. Slightly
     * tricky as:
     * "After the breakpoints have been chosen using the above sequences
     * for spaces and for optional hyphens, the individual lines
     * should not actually be justified, since a hyphen inserted by the
     * ‘penalty(6,500,1)’ would otherwise appear at the right margin."
     */
  }
  get last() {
    return this[this.length - 1];
  }
}

export class Item2<T extends Box | Glue | Penalty> {
  values: T;
  // type!: T['type'];
  // width!: T['width'];
  // rightHangingPunctuationWidth?: T extends Box ? T['rightHangingPunctuationWidth'] : undefined;
  // leftHangingPunctuationWidth?: T extends Box ? T['leftHangingPunctuationWidth']:undefined;
  // stretch?: T extends Glue ? T['stretch']:undefined;
  // shrink?: T extends Glue ? T['shrink']:undefined;
  // cost!: T extends Penalty ? T['cost']:undefined;
  // flagged?: T extends Penalty ? T['flagged']:undefined;

  get type() {
    return this.values.type;
  }
  get width() {
    return this.values.width;
  }
  get rightHangingPunctuationWidth(): number | undefined {
    return this.values.type === 'box' ? this.values.rightHangingPunctuationWidth : undefined;
  }
  get leftHangingPunctuationWidth(): number | undefined {
    return this.values.type === 'box' ? this.values.leftHangingPunctuationWidth : undefined;
  }
  get stretch(): T extends Glue ? T['stretch'] : undefined {
    return this.values.type === 'glue' ? this.values.stretch : undefined;
  }
  get shrink(): T extends Glue ? T['shrink'] : null {
    return this.values.shrink;
  }
  get cost(): T extends Penalty ? T['cost'] : null {
    return this.values.cost;
  }
  get flagged(): T extends Penalty ? T['flagged'] : null {
    return this.values.flagged;
  }

  get isPenalty() {
    return this.type === 'penalty';
  }

  get isForcedBreak() {
    return this.type === 'glue' && this.cost > MIN_COST;
  }

  get isSoftHyphen() {
    return this.type === 'penalty' && this.flagged && this.width > 0;
  }

  constructor(values: T) {
    this.values = values;
  }
}
