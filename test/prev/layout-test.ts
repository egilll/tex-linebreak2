import { breakLines, Item, Penalty } from 'src/breakLines/breakLines';
import { chunk, lineStrings } from 'src/deprecated/deprecatedTestUtils';
import { layoutItemsFromString } from 'src/deprecated/layoutItemsFromString';
import { adjustmentRatios, positionItems } from 'src/deprecated/positionItems';

import { box, forcedBreak, glue, penalty, TextBox, TextGlue, TextItem } from 'src/utils';

import fixture from 'test/prev/fixtures/layout';
import { XorShift } from 'xorshift';

interface LayoutFixture {
  /** Input text of paragraph. */
  input: string;

  outputs: {
    /** Line-breaking options. */
    layoutOptions: {
      maxAdjustmentRatio: number;
      charWidth: number;
      lineWidths: number | number[];
    };

    /** Expected broken lines. */
    lines: string[];
  }[];
}

/**
 * Read paragraph layout fixture from a file.
 *
 * The format of the fixture files is:
 *
 *     {input text}
 *
 *     {output 0 settings}
 *
 *     {output 0 lines}
 *
 *     {output 1 settings }
 *
 *     {output 1 lines}
 *     ...
 */
function readLayoutFixture(content: string): LayoutFixture {
  const defaultSettings = {
    charWidth: 5,
    maxAdjustmentRatio: 1,
  };

  const sections = content.split('\n\n');
  const input = sections[0];
  const outputs = [];
  for (let i = 1; i < sections.length; i += 2) {
    const outputSettings = JSON.parse(sections[i]);
    const outputLines = sections[i + 1].split('\n').filter((l) => l.length > 0);

    outputs.push({
      layoutOptions: {
        ...defaultSettings,
        ...outputSettings,
      },
      lines: outputLines,
    });
  }

  return {
    input,
    outputs,
  };
}

function repeat<T>(arr: T[], count: number) {
  let result = [];
  while (count) {
    --count;
    result.push(...arr);
  }
  return result;
}

function itemsFromString(s: string, charWidth: number, glueStretch: number): TextItem[] {
  const items = s.split(/(\s+|-)/).map((substr) => {
    const width = substr.length * charWidth;
    if (substr.match(/^\s+$/)) {
      return { type: 'glue', width, shrink: 2, stretch: glueStretch, text: substr } as TextGlue;
    } else if (substr === '-') {
      return { type: 'penalty', width, flagged: true, cost: 5 } as Penalty;
    } else {
      return { type: 'box', width, text: substr } as TextBox;
    }
  });
  items.push({ type: 'glue', width: 0, shrink: 0, stretch: 1000, text: '' });
  items.push(forcedBreak());
  return items;
}

describe('layout', () => {
  describe('breakLines', () => {
    it('returns an empty list if the input is empty', () => {
      const breakpoints = breakLines([], 100);
      expect(breakpoints).toEqual([]);
    });

    it('returns just the initial breakpoint if there are no legal breakpoints', () => {
      const breakpoints = breakLines([box(10)], 100);
      expect(breakpoints).toEqual([0]);
    });

    it('generates expected layout', () => {
      const f = readLayoutFixture(fixture);
      f.outputs.forEach(({ lines, layoutOptions }) => {
        const measure = (text: string) => text.length * 5;
        const items = layoutItemsFromString(f.input, measure);
        const breakpoints = breakLines(items, layoutOptions.lineWidths, layoutOptions);
        const itemText = (item: TextItem) => (item.type == 'box' ? item.text : ' ');

        // Check that breakpoints occur at expected positions.
        const actualLines = chunk(breakpoints, 2)
          .map(([start, end]) => items.slice(start, end).map(itemText).join('').trim())
          .filter((l) => l.length > 0);

        expect(actualLines).toEqual(lines);

        // Check that adjustment ratios for each line are in range.
        const adjRatios = adjustmentRatios(items, layoutOptions.lineWidths, breakpoints);
        adjRatios.forEach((ar) => {
          expect(ar).toBeGreaterThanOrEqual(-1);
          expect(ar).toBeLessThanOrEqual(layoutOptions.maxAdjustmentRatio);
        });
      });
    });

    it('uses defaults if options are omitted', () => {
      const measure = (text: string) => text.length * 5;
      const items = layoutItemsFromString('one fine day in the middle of the night', measure);
      const breakpoints = breakLines(items, 100);
      expect(breakpoints).toEqual([0, 9, 18]);
    });

    it('succeeds when min adjustment ratio is exceeded', () => {
      // Lay out input into a line with a width (5) of less than the box width
      // (10).
      // We'll give up and make lines which exceed the specified length.
      const lines = repeat([box(10), glue(5, 1, 1)], 5);
      const items: Item[] = [...lines, forcedBreak()];
      const breakpoints = breakLines(items, 5, {
        maxAdjustmentRatio: 1,
      });
      expect(breakpoints).toEqual([0, 1, 3, 5, 7, 9, 10]);
    });

    it('handles glue with zero stretch', () => {
      const items = [box(10), glue(5, 0, 0), box(10), forcedBreak()];
      const breakpoints = breakLines(items, 50);
      expect(breakpoints).toEqual([0, 3]);
    });

    it('handles glue with zero shrink', () => {
      const items = [box(10), glue(5, 0, 0), box(10), forcedBreak()];
      const breakpoints = breakLines(items, 21);
      expect(breakpoints).toEqual([0, 3]);
    });

    it('handles boxes that are wider than the line width', () => {
      const items = [box(5), glue(5, 10, 10), box(100), glue(5, 10, 10), forcedBreak()];
      const breakpoints = breakLines(items, 50);
      expect(breakpoints).toEqual([0, 3, 4]);
    });

    [
      {
        items: [box(10), glue(10, 10, 10), box(10), forcedBreak()],
        lineWidth: 1000,
        expectedBreakpoints: [0, 3],
      },
      {
        items: [box(10), glue(10, 5, 5), box(100), forcedBreak()],
        lineWidth: 50,
        expectedBreakpoints: [0, 3],
      },
    ].forEach(({ items, lineWidth, expectedBreakpoints }, i) => {
      it(`succeeds when initial max adjustment ratio is exceeded (${i + 1})`, () => {
        // Lay out input into a line which would need to stretch more than
        // `glue.width + maxAdjustmentRatio * glue.stretch` in order to fit.
        //
        // Currently the algorithm will simply retry with a higher threshold. If
        // we followed TeX's solution (see Knuth-Plass p.1162) then we would first
        // retry with the same threshold after applying hyphenation to break
        // existing boxes and then only after that retry with a higher threshold.
        const breakpoints = breakLines(items, lineWidth, {
          initialMaxAdjustmentRatio: 1,
        });
        expect(breakpoints).toEqual(expectedBreakpoints);
      });
    });

    it('applies a penalty for consecutive lines ending with a hyphen', () => {
      const text = 'one two long-word one long-word';
      const charWidth = 5;
      const glueStretch = 60;
      const items = itemsFromString(text, charWidth, glueStretch);
      const lineWidth = 13 * charWidth;

      // Break lines without a double-hyphen penalty.
      let breakpoints = breakLines(items, lineWidth);
      let lines = lineStrings(items, breakpoints);
      expect(lines).toEqual(['one two long-', 'word one long-', 'word']);

      // Break lines with a double-hyphen penalty.
      breakpoints = breakLines(items, lineWidth, {
        doubleHyphenPenalty: 200,
      });
      lines = lineStrings(items, breakpoints);
      expect(lines).toEqual(['one two', 'longword one', 'longword']);
    });

    it('applies a penalty when adjacent lines have different tightness', () => {
      // Getting this test case to produce different output with and without the
      // penalty applied required ~~lots of fiddling~~ highly scientific
      // adjustments.
      //
      // It requires that boxes have enough variety and maximum width, and glues
      // have sufficiently small stretch, that adjustment ratios between lines
      // are large enough to fall into different "fitness class" thresholds.
      const prng = new XorShift([1, 10, 15, 20]);
      const wordSoup = (length: number) => {
        let result: Item[] = [];
        let wordLen = 5;
        while (result.length < length) {
          result.push({ type: 'box', width: prng.random() * 20 });
          result.push({ type: 'glue', width: 6, shrink: 3, stretch: 5 });
        }
        return result;
      };
      const items = wordSoup(100);
      const lineWidth = 50;

      // Break lines without contrasting tightness penalty.
      let breakpointsA = breakLines(items, lineWidth, {
        adjacentLooseTightPenalty: 0,
      });

      // Break lines with contrasting tightness penalty.
      let breakpointsB = breakLines(items, lineWidth, {
        adjacentLooseTightPenalty: 10000,
      });

      expect(breakpointsA).not.toEqual(breakpointsB);
    });

    it('throws if an item has negative width', () => {
      const items = [box(-10), glue(5, 10, 10), forcedBreak()];
      expect(() => breakLines(items, 15)).toThrow();
    });

    it('throws if a glue item has negative shrink', () => {
      const items = [box(10), glue(5, -10, 10), forcedBreak()];
      expect(() => breakLines(items, 15)).toThrow();
    });

    it('throws if a glue item has negative stretch', () => {
      const items = [box(10), glue(5, 10, -10), forcedBreak()];
      expect(() => breakLines(items, 15)).toThrow();
    });

    it('throws `MaxAdjustmentExceededError` if max adjustment ratio is exceeded', () => {
      const items = [box(10), glue(5, 10, 10), box(10), forcedBreak()];
      const opts = { maxAdjustmentRatio: 1 };
      expect(() => breakLines(items, 100, opts)).toThrow();
    });
  });

  describe('positionItems', () => {
    it('lays out items with justified margins', () => {
      const items = [
        box(10),
        glue(10, 5, 5),
        box(10),
        glue(10, 5, 5),
        box(10),
        glue(10, 5, 5),
        forcedBreak(),
      ];
      const lineWidth = 35;
      const breakpoints = [0, 3, 6];

      const boxes = positionItems(items, lineWidth, breakpoints);

      expect(boxes).toEqual([
        {
          item: 0,
          line: 0,
          xOffset: 0,
          width: 10,
        },
        {
          item: 2,
          line: 0,
          xOffset: 25,
          width: 10,
        },
        {
          item: 4,
          line: 1,
          xOffset: 0,
          width: 10,
        },
      ]);
    });

    it('does not let gap between boxes shrink below `glue.width - glue.shrink`', () => {
      const items = [box(10), glue(10, 5, 5), box(100), forcedBreak()];
      const lineWidth = 50;
      const breakpoints = [0, 3];

      const boxes = positionItems(items, lineWidth, breakpoints);

      expect(boxes).toEqual([
        {
          item: 0,
          line: 0,
          xOffset: 0,
          width: 10,
        },
        {
          item: 2,
          line: 0,
          xOffset: 15,
          width: 100,
        },
      ]);
    });
  });
});
