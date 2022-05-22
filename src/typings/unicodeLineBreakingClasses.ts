/**
 * Classes describing line-breaking behavior.
 * For an overview of behavior, consult the table at
 * http://unicode.org/reports/tr14/#Table1
 */
export enum UnicodeLineBreakingClasses {
  /**
   * Opening punctuation
   * @see http://unicode.org/reports/tr14/#OP
   */
  OP = 0,
  OpeningPunctuation = UnicodeLineBreakingClasses.OP,

  /**
   * Closing punctuation
   * @see http://unicode.org/reports/tr14/#CL
   */
  CL = 1,
  ClosingPunctuation = UnicodeLineBreakingClasses.CL,

  /**
   * Closing parenthesis
   * @see http://unicode.org/reports/tr14/#CP
   */
  CP = 2,
  ClosingParenthesis = UnicodeLineBreakingClasses.CP,

  /**
   * Ambiguous quotation
   * @see http://unicode.org/reports/tr14/#QU
   */
  QU = 3,
  AmbiguousQuotation = UnicodeLineBreakingClasses.QU,

  /**
   * Non-breaking ("glue")
   * @see http://unicode.org/reports/tr14/#GL
   */
  GL = 4,
  NonBreaking = UnicodeLineBreakingClasses.GL,

  /**
   * Non-starters
   * @see http://unicode.org/reports/tr14/#NS
   */
  NS = 5,
  NonStarter = UnicodeLineBreakingClasses.NS,

  /**
   * Exclamation/Interrogation
   * @see http://unicode.org/reports/tr14/#EX
   */
  EX = 6,
  ExclamationOrInterrogation = UnicodeLineBreakingClasses.EX,

  /**
   * Symbols allowing break after
   * @see http://unicode.org/reports/tr14/#SY
   */
  SY = 7,
  SymbolAllowingBreakAfter = UnicodeLineBreakingClasses.SY,

  /**
   * Infix separator
   * @see http://unicode.org/reports/tr14/#IS
   */
  IS = 8,
  InfixSeparator = UnicodeLineBreakingClasses.IS,

  /**
   * Prefix
   * @see http://unicode.org/reports/tr14/#PR
   */
  PR = 9,
  Prefix = UnicodeLineBreakingClasses.PR,

  /**
   * Postfix
   * @see http://unicode.org/reports/tr14/#PO
   */
  PO = 10,
  Postfix = UnicodeLineBreakingClasses.PO,

  /**
   * Numeric
   * @see http://unicode.org/reports/tr14/#NU
   */
  NU = 11,
  Numeric = UnicodeLineBreakingClasses.NU,

  /**
   * Alphabetic
   * @see http://unicode.org/reports/tr14/#AL
   */
  AL = 12,
  Alphabetic = UnicodeLineBreakingClasses.AL,

  /**
   * Hebrew Letter
   * @see http://unicode.org/reports/tr14/#HL
   */
  HL = 13,
  HebrewLetter = UnicodeLineBreakingClasses.HL,

  /**
   * Ideographic
   * @see http://unicode.org/reports/tr14/#ID
   */
  ID = 14,
  Ideographic = UnicodeLineBreakingClasses.ID,

  /**
   * Inseparable characters
   * @see http://unicode.org/reports/tr14/#IN
   */
  IN = 15,
  InseparableCharacters = UnicodeLineBreakingClasses.IN,

  /**
   * Hyphen
   * @see http://unicode.org/reports/tr14/#HY
   */
  HY = 16,
  Hyphen = UnicodeLineBreakingClasses.HY,

  /**
   * Break after
   * @see http://unicode.org/reports/tr14/#BA
   */
  BA = 17,
  BreakAfter = UnicodeLineBreakingClasses.BA,

  /**
   * Break before
   * @see http://unicode.org/reports/tr14/#BB
   */
  BB = 18,
  BreakBefore = UnicodeLineBreakingClasses.BB,

  /**
   * Break on either side (but not pair)
   * @see http://unicode.org/reports/tr14/#B2
   */
  B2 = 19,
  BreakOnEitherSide = UnicodeLineBreakingClasses.B2,

  /**
   * Zero-width space
   * @see http://unicode.org/reports/tr14/#ZW
   */
  ZW = 20,
  ZeroWidthSpace = UnicodeLineBreakingClasses.ZW,

  /**
   * Combining marks
   * @see http://unicode.org/reports/tr14/#CM
   */
  CM = 21,
  CombiningMark = UnicodeLineBreakingClasses.CM,

  /**
   * Word joiner
   * @see http://unicode.org/reports/tr14/#WJ
   */
  WJ = 22,
  WordJoiner = UnicodeLineBreakingClasses.WJ,

  /**
   * Hangul LV
   * @see http://unicode.org/reports/tr14/#H2
   */
  H2 = 23,
  HangulLV = UnicodeLineBreakingClasses.H2,

  /**
   * Hangul LVT
   * @see http://unicode.org/reports/tr14/#H3
   */
  H3 = 24,
  HangulLVT = UnicodeLineBreakingClasses.H3,

  /**
   * Hangul L Jamo
   * @see http://unicode.org/reports/tr14/#JL
   */
  JL = 25,
  HangulLJamo = UnicodeLineBreakingClasses.JL,

  /**
   * Hangul V Jamo
   * @see http://unicode.org/reports/tr14/#JV
   */
  JV = 26,
  HangulVJamo = UnicodeLineBreakingClasses.JV,

  /**
   * Hangul T Jamo
   * @see http://unicode.org/reports/tr14/#JT
   */
  JT = 27,
  HangulTJamo = UnicodeLineBreakingClasses.JT,

  /**
   * Regional Indicator
   * @see http://unicode.org/reports/tr14/#RI
   */
  RI = 28,
  RegionalIndicator = UnicodeLineBreakingClasses.RI,

  /**
   * Emoji Base
   * @see http://unicode.org/reports/tr14/#EB
   */
  EB = 29,
  EmojiBase = UnicodeLineBreakingClasses.EB,

  /**
   * Emoji Modifier
   * @see http://unicode.org/reports/tr14/#EM
   */
  EM = 30,
  EmojiModifier = UnicodeLineBreakingClasses.EM,

  /**
   * Zero Width Joiner
   * @see http://unicode.org/reports/tr14/#ZWJ
   */
  ZWJ = 31,
  ZeroWidthJoiner = UnicodeLineBreakingClasses.ZWJ,

  /**
   * Contingent break
   * @see http://unicode.org/reports/tr14/#CB
   */
  CB = 32,
  ContingentBreak = UnicodeLineBreakingClasses.CB,

  /**
   * Ambiguous (Alphabetic or Ideograph)
   * @see http://unicode.org/reports/tr14/#AI
   */
  AI = 33,
  AmbiguousAlphabeticOrIdeograph = UnicodeLineBreakingClasses.AI,

  /**
   * Break (mandatory)
   * @see http://unicode.org/reports/tr14/#BK
   */
  BK = 34,
  BreakMandatory = UnicodeLineBreakingClasses.BK,

  /**
   * Conditional Japanese Starter
   * @see http://unicode.org/reports/tr14/#CJ
   */
  CJ = 35,
  ConditionalJapaneseStarter = UnicodeLineBreakingClasses.CJ,

  /**
   * Carriage return
   * @see http://unicode.org/reports/tr14/#CR
   */
  CR = 36,
  CarriageReturn = UnicodeLineBreakingClasses.CR,

  /**
   * Line feed
   * @see http://unicode.org/reports/tr14/#LF
   */
  LF = 37,
  LineFeed = UnicodeLineBreakingClasses.LF,

  /**
   * Next line
   * @see http://unicode.org/reports/tr14/#NL
   */
  NL = 38,
  NextLine = UnicodeLineBreakingClasses.NL,

  /**
   * South-East Asian
   * @see http://unicode.org/reports/tr14/#SA
   */
  SA = 39,
  SouthEastAsian = UnicodeLineBreakingClasses.SA,

  /**
   * Surrogates
   * @see http://unicode.org/reports/tr14/#SG
   */
  SG = 40,
  Surrogates = UnicodeLineBreakingClasses.SG,

  /**
   * Space
   * @see http://unicode.org/reports/tr14/#SP
   */
  SP = 41,
  Space = UnicodeLineBreakingClasses.SP,

  /**
   * Unknown
   * @see http://unicode.org/reports/tr14/#XX
   */
  XX = 42,
  Unknown = UnicodeLineBreakingClasses.XX,
}
