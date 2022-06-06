declare module "linebreak" {
  export interface Break {
    position: number;
    required: boolean;
  }

  /** @see LineBreakingClass */
  export default class LineBreaker {
    constructor(string: string);
    string: string;
    pos: number;
    lastPos: number;

    /**
     * Is null at the beginning of a string
     *
     * @private
     */
    curClass: number | null;

    /** @private, use {@link LineBreaker.nextCharClass()} instead */
    nextClass: number | null;

    /**
     * "Do not break after a zero width joiner", for example as used in emojis.
     * http://unicode.org/reports/tr14/#LB8a
     */
    LB8a: boolean;

    /**
     * "Don't break after Hebrew + Hyphen."
     * https://unicode.org/reports/tr14/#LB21a
     */
    LB21a: boolean;

    /**
     * "Break between two regional indicator symbols if and only if
     * there are an even number of regional indicators preceding the
     * position of the break." https://unicode.org/reports/tr14/#LB30a
     */
    LB30a: number;

    nextBreak(): Break;
    nextCharClass(): number;

    /** @private */
    getPairTableBreak(lastClass: number): boolean;

    /** @private */
    getSimpleBreak(): boolean;

    /** The character code (char code) at the next breakpoint */
    nextCodePoint(): number;
  }
}
