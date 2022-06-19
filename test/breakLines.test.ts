import { assert, expect } from "chai";
import { breakLines, Item } from "src/breakLines";
import { texLinebreakMonospace } from "src/presets/presets";
import { box, forcedBreak, glue } from "src/utils/items";
import { XorShift } from "xorshift";

describe("layout", () => {
  describe("breakLines", () => {
    it("returns an empty list if the input is empty", () => {
      const { breakpoints } = breakLines([], { lineWidth: 100 });
      assert.deepEqual(breakpoints, []);
    });

    it("generates expected layout", () => {
      const input = `The Boat Races 2017 (also known as The Cancer Research UK Boat Races for the purposes of sponsorship) took place on 2 April 2017. Held annually, the Boat Race is a side-by-side rowing race between crews from the universities of Oxford and Cambridge along a 4.2-mile (6.8 km) tidal stretch of the River Thames in south-west London. For the second time in the history of the event, the men's, women's and both reserves' races were all held on the Tideway on the same day.`;

      const t = texLinebreakMonospace(input, {
        lineWidth: 41,
      });

      assert.deepEqual(t.plaintextLines, [
        "The Boat Races 2017 (also known as The",
        "Cancer Research UK Boat Races for the",
        "purposes of sponsorship) took place on 2",
        "April 2017. Held annually, the Boat Race",
        "is a side-by-side rowing race between",
        "crews from the universities of Oxford and",
        "Cambridge along a 4.2-mile (6.8 km) tidal",
        "stretch of the River Thames in south-",
        "west London. For the second time in the",
        "history of the event, the men's, women's",
        "and both reserves' races were all held",
        "on the Tideway on the same day.",
      ]);

      // Check that adjustment ratios for each line are in range.
      t.lines.forEach((line) => {
        expect(line.adjustmentRatio).to.be.gte(-1);
        // expect(line.adjustmentRatio).toBeLessThanOrEqual(layoutOptions.maxAdjustmentRatio);
      });
    });

    it("succeeds when min adjustment ratio is exceeded", () => {
      // Lay out input into a line with a width (5) of less than the box width
      // (10).
      // We'll give up and make lines which exceed the specified length.
      const items: Item[] = [];
      for (let i = 0; i < 5; i++) {
        items.push(box(10), glue(5, 1, 1));
      }
      items.push(forcedBreak());
      const { breakpoints } = breakLines(items, {
        lineWidth: 5,
        maxAdjustmentRatio: 1,
      });
      assert.deepEqual(breakpoints, [0, 1, 3, 5, 7, 9, 10]);
    });

    it("handles glue with zero stretch", () => {
      const items = [box(10), glue(5, 0, 0), box(10), forcedBreak()];
      const { breakpoints } = breakLines(items, { lineWidth: 50 });
      assert.deepEqual(breakpoints, [0, 3]);
    });

    it("handles glue with zero shrink", () => {
      const items = [box(10), glue(5, 0, 0), box(10), forcedBreak()];
      const { breakpoints } = breakLines(items, { lineWidth: 21 });
      assert.deepEqual(breakpoints, [0, 1, 3]);
    });

    it("handles boxes that are wider than the line width", () => {
      const items = [
        box(5),
        glue(5, 10, 10),
        box(100),
        glue(5, 10, 10),
        forcedBreak(),
      ];
      const { breakpoints } = breakLines(items, { lineWidth: 50 });
      assert.deepEqual(breakpoints, [0, 1, 3, 4]);
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
        expectedBreakpoints: [0, 1, 3],
      },
    ].forEach(({ items, lineWidth, expectedBreakpoints }, i) => {
      it(`succeeds when initial max adjustment ratio is exceeded (${
        i + 1
      })`, () => {
        // Lay out input into a line which would need to stretch more than
        // `glue.width + maxAdjustmentRatio * glue.stretch` in order to fit.
        //
        // Currently the algorithm will simply retry with a higher threshold. If
        // we followed TeX's solution (see Knuth-Plass p.1162) then we would first
        // retry with the same threshold after applying hyphenation to break
        // existing boxes and then only after that retry with a higher threshold.
        const { breakpoints } = breakLines(items, {
          lineWidth,
          initialMaxAdjustmentRatio: 1,
        });
        assert.deepEqual(breakpoints, expectedBreakpoints);
      });
    });

    // Turned off as normal hyphens are not penalized
    // it('applies a penalty for consecutive lines ending with a hyphen', () => {
    //   const text = `one two long-word one long-word`;
    //   const lineWidth = 13;
    //
    //   // Break lines without a double-hyphen penalty.
    //   assert.deepEqual(
    //     texLinebreakMonospace(text, {
    //       lineWidth,
    //       doubleHyphenPenalty: 0,
    //       hangingPunctuation: false,
    //     }).plaintextLines,
    //   , ['one two long-', 'word one long-', 'word']);
    //
    //   // Break lines with a double-hyphen penalty.
    //   assert.deepEqual(
    //     texLinebreakMonospace(text, {
    //       lineWidth,
    //       doubleHyphenPenalty: 200,
    //       hangingPunctuation: false,
    //     }).plaintextLines,
    //   , ['one two', 'longword one', 'longword']);
    // });

    it("applies a penalty when adjacent lines have different tightness", () => {
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
        while (result.length < length) {
          result.push({ type: "box", width: prng.random() * 20 });
          result.push({ type: "glue", width: 6, shrink: 3, stretch: 5 });
        }
        return result;
      };
      const items = [...wordSoup(100), forcedBreak()];
      const lineWidth = 50;

      // Break lines without contrasting tightness penalty.
      let breakpointsA = breakLines(items, {
        lineWidth,
        adjacentLooseTightPenalty: 0,
      });

      // Break lines with contrasting tightness penalty.
      let breakpointsB = breakLines(items, {
        lineWidth,
        adjacentLooseTightPenalty: 10000,
      });

      expect(breakpointsA).not.to.eq(breakpointsB);
    });

    it("throws `MaxAdjustmentExceededError` if max adjustment ratio is exceeded", () => {
      const items = [box(10), glue(5, 10, 10), box(10), forcedBreak()];
      const opts = { maxAdjustmentRatio: 1 };
      expect(() => breakLines(items, { lineWidth: 100, ...opts })).to.throw();
    });
  });

  describe("positionItems", () => {
    // it('lays out items with justified margins', () => {
    //   const items = [
    //     box(10),
    //     glue(10, 5, 5),
    //     box(10),
    //     glue(10, 5, 5),
    //     box(10),
    //     glue(10, 5, 5),
    //     forcedBreak(),
    //   ];
    //   const lineWidth = 35;
    //   const {breakpoints} = [0, 3, 6];
    //
    //   const boxes = positionItems(items, lineWidth, breakpoints);
    //
    //   assert.deepEqual(boxes, [
    //     {
    //       item: 0,
    //       line: 0,
    //       xOffset: 0,
    //       width: 10,
    //     },
    //     {
    //       item: 2,
    //       line: 0,
    //       xOffset: 25,
    //       width: 10,
    //     },
    //     {
    //       item: 4,
    //       line: 1,
    //       xOffset: 0,
    //       width: 10,
    //     },
    //   ]);
    // });
    // it('does not let gap between boxes shrink below `glue.width - glue.shrink`', () => {
    //   const items = [box(10), glue(10, 5, 5), box(100), forcedBreak()];
    //   const lineWidth = 50;
    //   const {breakpoints} = [0, 3];
    //
    //   const boxes = positionItems(items, lineWidth, breakpoints);
    //
    //   assert.deepEqual(boxes, [
    //     {
    //       item: 0,
    //       line: 0,
    //       xOffset: 0,
    //       width: 10,
    //     },
    //     {
    //       item: 2,
    //       line: 0,
    //       xOffset: 15,
    //       width: 100,
    //     },
    //   ]);
    // });
  });
});
