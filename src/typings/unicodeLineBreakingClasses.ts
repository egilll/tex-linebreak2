/**
 * Classes describing line-breaking behavior, enum values as
 * used by the https://github.com/foliojs/linebreak package.
 *
 * For an overview of behavior, consult the table at
 * http://unicode.org/reports/tr14/#Table1
 */
export enum UnicodeLineBreakingClasses {
  /**
   * Opening punctuation
   *
   * @see http://unicode.org/reports/tr14/#OP
   */
  OpeningPunctuation = "OP",

  /**
   * Closing punctuation
   *
   * @see http://unicode.org/reports/tr14/#CL
   */
  ClosingPunctuation = "CL",

  /**
   * Closing parenthesis
   *
   * @see http://unicode.org/reports/tr14/#CP
   */
  ClosingParenthesis = "CP",

  /**
   * Ambiguous quotation
   *
   * @see http://unicode.org/reports/tr14/#QU
   */
  AmbiguousQuotation = "QU",

  /**
   * Non-breaking ("glue")
   *
   * @see http://unicode.org/reports/tr14/#GL
   */
  NonBreaking = "GL",

  /**
   * Non-starters
   *
   * @see http://unicode.org/reports/tr14/#NS
   */
  NonStarter = "NS",

  /**
   * Exclamation/Interrogation
   *
   * @see http://unicode.org/reports/tr14/#EX
   */
  ExclamationOrInterrogation = "EX",

  /**
   * Symbols allowing break after
   *
   * @see http://unicode.org/reports/tr14/#SY
   */
  SymbolAllowingBreakAfter = "SY",

  /**
   * Infix separator
   *
   * @see http://unicode.org/reports/tr14/#IS
   */
  InfixSeparator = "IS",

  /**
   * Prefix
   *
   * @see http://unicode.org/reports/tr14/#PR
   */
  Prefix = "PR",

  /**
   * Postfix
   *
   * @see http://unicode.org/reports/tr14/#PO
   */
  Postfix = "PO",

  /**
   * Numeric
   *
   * @see http://unicode.org/reports/tr14/#NU
   */
  Numeric = "NU",

  /**
   * Alphabetic
   *
   * @see http://unicode.org/reports/tr14/#AL
   */
  Alphabetic = "AL",

  /**
   * Hebrew Letter
   *
   * @see http://unicode.org/reports/tr14/#HL
   */
  HebrewLetter = "HL",

  /**
   * Ideographic
   *
   * @see http://unicode.org/reports/tr14/#ID
   */
  Ideographic = "ID",

  /**
   * Inseparable characters
   *
   * @see http://unicode.org/reports/tr14/#IN
   */
  InseparableCharacters = "IN",

  /**
   * Hyphen
   *
   * @see http://unicode.org/reports/tr14/#HY
   */
  Hyphen = "HY",

  /**
   * Break after
   *
   * @see http://unicode.org/reports/tr14/#BA
   */
  BreakAfter = "BA",

  /**
   * Break before
   *
   * @see http://unicode.org/reports/tr14/#BB
   */
  BreakBefore = "BB",

  /**
   * Break on either side (but not pair)
   *
   * @see http://unicode.org/reports/tr14/#B2
   */
  BreakOnEitherSide = "B2",

  /**
   * Zero-width space
   *
   * @see http://unicode.org/reports/tr14/#ZW
   */
  ZeroWidthSpace = "ZW",

  /**
   * Combining marks
   *
   * @see http://unicode.org/reports/tr14/#CM
   */
  CombiningMark = "CM",

  /**
   * Word joiner
   *
   * @see http://unicode.org/reports/tr14/#WJ
   */
  WordJoiner = "WJ",

  /**
   * Hangul LV
   *
   * @see http://unicode.org/reports/tr14/#H2
   */
  HangulLV = "H2",

  /**
   * Hangul LVT
   *
   * @see http://unicode.org/reports/tr14/#H3
   */
  HangulLVT = "H3",

  /**
   * Hangul L Jamo
   *
   * @see http://unicode.org/reports/tr14/#JL
   */
  HangulLJamo = "JL",

  /**
   * Hangul V Jamo
   *
   * @see http://unicode.org/reports/tr14/#JV
   */
  HangulVJamo = "JV",

  /**
   * Hangul T Jamo
   *
   * @see http://unicode.org/reports/tr14/#JT
   */
  HangulTJamo = "JT",

  /**
   * Regional Indicator
   *
   * @see http://unicode.org/reports/tr14/#RI
   */
  RegionalIndicator = "RI",

  /**
   * Emoji Base
   *
   * @see http://unicode.org/reports/tr14/#EB
   */
  EmojiBase = "EB",

  /**
   * Emoji Modifier
   *
   * @see http://unicode.org/reports/tr14/#EM
   */
  EmojiModifier = "EM",

  /**
   * Zero Width Joiner
   *
   * @see http://unicode.org/reports/tr14/#ZWJ
   */
  ZeroWidthJoiner = "ZWJ",

  /**
   * Contingent break
   *
   * @see http://unicode.org/reports/tr14/#CB
   */
  ContingentBreak = "CB",

  /**
   * Ambiguous (Alphabetic or Ideograph)
   *
   * @see http://unicode.org/reports/tr14/#AI
   */
  AmbiguousAlphabeticOrIdeograph = "AI",

  /**
   * Break (mandatory)
   *
   * @see http://unicode.org/reports/tr14/#BK
   */
  BreakMandatory = "BK",

  /**
   * Conditional Japanese Starter
   *
   * @see http://unicode.org/reports/tr14/#CJ
   */
  ConditionalJapaneseStarter = "CJ",

  /**
   * Carriage return
   *
   * @see http://unicode.org/reports/tr14/#CR
   */
  CarriageReturn = "CR",

  /**
   * Line feed
   *
   * @see http://unicode.org/reports/tr14/#LF
   */
  LineFeed = "LF",

  /**
   * Next line
   *
   * @see http://unicode.org/reports/tr14/#NL
   */
  NextLine = "NL",

  /**
   * South-East Asian
   *
   * @see http://unicode.org/reports/tr14/#SA
   */
  SouthEastAsian = "SA",

  /**
   * Surrogates
   *
   * @see http://unicode.org/reports/tr14/#SG
   */
  Surrogates = "SG",

  /**
   * Space
   *
   * @see http://unicode.org/reports/tr14/#SP
   */
  Space = "SP",

  /**
   * Unknown
   *
   * @see http://unicode.org/reports/tr14/#XX
   */
  Unknown = "XX",
}

/**
 * Converts the values from https://github.com/foliojs/linebreak
 * into a more readable format.
 */
export const convertEnumValuesOfLineBreakingPackageToUnicodeNames = {
  1: "CL", // Closing punctuation
  2: "CP", // Closing parenthesis
  3: "QU", // Ambiguous quotation
  4: "GL", // Glue
  5: "NS", // Non-starters
  6: "EX", // Exclamation/Interrogation
  7: "SY", // Symbols allowing break after
  8: "IS", // Infix separator
  9: "PR", // Prefix
  10: "PO", // Postfix
  11: "NU", // Numeric
  12: "AL", // Alphabetic
  13: "HL", // Hebrew Letter
  14: "ID", // Ideographic
  15: "IN", // Inseparable characters
  16: "HY", // Hyphen
  17: "BA", // Break after
  18: "BB", // Break before
  19: "B2", // Break on either side (but not pair)
  20: "ZW", // Zero-width space
  21: "CM", // Combining marks
  22: "WJ", // Word joiner
  23: "H2", // Hangul LV
  24: "H3", // Hangul LVT
  25: "JL", // Hangul L Jamo
  26: "JV", // Hangul V Jamo
  27: "JT", // Hangul T Jamo
  28: "RI", // Regional Indicator
  29: "EB", // Emoji Base
  30: "EM", // Emoji Modifier
  31: "ZWJ", // Zero Width Joiner
  32: "CB", // Contingent break
  33: "AI", // Ambiguous (Alphabetic or Ideograph)
  34: "BK", // Break (mandatory)
  35: "CJ", // Conditional Japanese Starter
  36: "CR", // Carriage return
  37: "LF", // Line feed
  38: "NL", // Next line
  39: "SA", // South-East Asian
  40: "SG", // Surrogates
  41: "SP", // Space
  42: "XX", // Unknown
} as const;
