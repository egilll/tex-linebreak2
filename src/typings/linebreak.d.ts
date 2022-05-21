declare module 'linebreak' {
  interface Break {
    position: number;
    required: boolean;
  }

  /**
   * Character classes from table 1:
   * http://unicode.org/reports/tr14/#Table1
   */
  enum LineBreakingClass {
    /** "Opening punctuation" */
    OP = 0,
    /** "Closing punctuation" */
    CL = 1,
    /** "Closing parenthesis" */
    CP = 2,
    /** "Ambiguous quotation" */
    QU = 3,
    /** "Glue" */
    GL = 4,
    /** "Non-starters" */
    NS = 5,
    /** "Exclamation/Interrogation" */
    EX = 6,
    /** "Symbols allowing break after" */
    SY = 7,
    /** "Infix separator" */
    IS = 8,
    /** "Prefix" */
    PR = 9,
    /** "Postfix" */
    PO = 10,
    /** "Numeric" */
    NU = 11,
    /** "Alphabetic" */
    AL = 12,
    /** "Hebrew Letter" */
    HL = 13,
    /** "Ideographic" */
    ID = 14,
    /** "Inseparable characters" */
    IN = 15,
    /** "Hyphen" */
    HY = 16,
    /** "Break after" */
    BA = 17,
    /** "Break before" */
    BB = 18,
    /** "Break on either side (but not pair)" */
    B2 = 19,
    /** "Zero-width space" */
    ZW = 20,
    /** "Combining marks" */
    CM = 21,
    /** "Word joiner" */
    WJ = 22,
    /** "Hangul LV" */
    H2 = 23,
    /** "Hangul LVT" */
    H3 = 24,
    /** "Hangul L Jamo" */
    JL = 25,
    /** "Hangul V Jamo" */
    JV = 26,
    /** "Hangul T Jamo" */
    JT = 27,
    /** "Regional Indicator" */
    RI = 28,
    /** "Emoji Base" */
    EB = 29,
    /** "Emoji Modifier" */
    EM = 30,
    /** "Zero Width Joiner" */
    ZWJ = 31,
    /** "Contingent break" */
    CB = 32,
    /** "Ambiguous (Alphabetic or Ideograph)" */
    AI = 33,
    /** "Break (mandatory)" */
    BK = 34,
    /** "Conditional Japanese Starter" */
    CJ = 35,
    /** "Carriage return" */
    CR = 36,
    /** "Line feed" */
    LF = 37,
    /** "Next line" */
    NL = 38,
    /** "South-East Asian" */
    SA = 39,
    /** "Surrogates" */
    SG = 40,
    /** "Space" */
    SP = 41,
    /** "Unknown" */
    XX = 42,
  }

  export default class LineBreaker {
    constructor(string: string);
    string: string;
    pos: number;
    lastPos: number;

    /** Is null at the beginning of a string */
    curClass: LineBreakingClass | null;

    /**
     * @private, use {@link LineBreaker.nextCharClass()} instead
     */
    nextClass: LineBreakingClass | null;

    /**
     * "Do not break after a zero width joiner",
     * for example as used in emojis.
     * http://unicode.org/reports/tr14/#LB8a
     */
    LB8a: boolean;

    /**
     * "Don't break after Hebrew + Hyphen."
     * https://unicode.org/reports/tr14/#LB21a
     */
    LB21a: boolean;

    /**
     * "Break between two regional indicator symbols
     * if and only if there are an even number of regional indicators
     * preceding the position of the break."
     * https://unicode.org/reports/tr14/#LB30a
     */
    LB30a: number;

    nextBreak(): Break;
    nextCharClass(): LineBreakingClass;

    /** @private */
    getPairTableBreak(lastClass: LineBreakingClass): boolean;

    /** @private */
    getSimpleBreak(): boolean;

    /**
     * The character code (char code) at the next breakpoint
     */
    nextCodePoint(): number;
  }
}
