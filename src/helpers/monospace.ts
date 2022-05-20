export const splitParagraphsIntoItems = (
  paragraphs: ParagraphWithWidth[],
  options: AllOptions,
): (Box | Glue | Penalty)[][] => {
  return paragraphs.map((paragraph) => {
    let items: (Box | Glue | Penalty)[] = [];
    const lineLength = paragraph.printWidth;

    /**
     * Split into 1. words (including their following punctuation) and 2. whitespace
     */
    const chunks = paragraph.paragraph
      /* Collapse spaces */
      .replace(/ +/g, ' ')
      /* Collapse spaces around newlines */
      .replace(/ ?\n ?/g, '\n')
      /* Split on spaces and newlines */
      .split(/([ \n])/)
      .filter((w) => w.length > 0);

    chunks.forEach((chunk, index) => {
      if (
        chunk === '\n' &&
        index > 0 &&
        ((options.jsdocRespectNewlineAfterPeriod && /[.:?!]$/.test(chunks[index - 1])) ||
          /** Always keep newlines after backslash (see: https://github.com/hosseinmd/prettier-plugin-jsdoc/issues/102) */
          /\\$/.test(chunks[index - 1]))
      ) {
        /** Keep newline after punctuation */
        items.push({
          type: 'glue',
          width: 0,
          text: '',
          stretch: MAX_COST,
          lineLength,
        });
        items.push({ type: 'penalty', cost: MIN_COST, width: 0, lineLength });
      } else if (
        (chunk === ' ' || chunk === '\n') &&
        /**
         * Never break inside tags such as `{@link example}`.
         * Instead, such spaces will be marked as "words".
         */
        !/{@[a-z]+/i.test(chunks[index - 1])
      ) {
        /** Space */
        items.push({
          type: 'glue',
          width: 1,
          text: ' ',
          stretch: 0,
          lineLength: lineLength,
        });
      } else {
        /** Word */
        items.push({
          type: 'box',
          width: chunk.length,
          text: chunk,
          lineLength: lineLength,
        });
      }
    });
    items.push({
      type: 'glue',
      width: 0,
      stretch: MAX_COST,
      text: '',
      lineLength,
    });
    items.push({ type: 'penalty', cost: MIN_COST, width: 0, lineLength });
    return items;
  });
};
