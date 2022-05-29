import { penalty, isForcedBreak } from 'src/helpers/util';
import { LineWidth } from 'src/html/lineWidth';

/** An object (eg. a word) to be typeset. */
export interface Box {
  type: 'box';
  /** Amount of space required by this content. Must be >= 0. */
  width: number;
}

/**
 * A space between `Box` items with a preferred width and some capacity to stretch or shrink.
 *
 * `Glue` items are also candidates for breakpoints if they immediately follow a `Box`.
 */
export interface Glue {
  type: 'glue';
  /** Preferred width of this space. Must be >= 0. */
  width: number;
  /** Maximum amount by which this space can grow. */
  stretch: number;
  /** Maximum amount by which this space can shrink. */
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
   * Values <= `MIN_COST` and >= `MAX_COST` mandate or prevent breakpoints respectively.
   */
  cost: number;
  /**
   * A hint used to prevent successive lines being broken with hyphens. The layout
   * algorithm will try to avoid successive lines being broken at flagged `Penalty` items.
   */
  flagged?: boolean;
}

export type Item = Box | Penalty | Glue;

/**
 * Minimum cost for a breakpoint.
 *
 * Values <= `MIN_COST` force a break.
 */
export const MIN_COST = -1000;

/**
 * Maximum cost for a breakpoint.
 *
 * Values >= `MAX_COST` prevent a break.
 */
export const MAX_COST = 1000;

export const MIN_ADJUSTMENT_RATIO = -1;

/** Error thrown by `breakLines` when `maxAdjustmentRatio` is exceeded. */
export class MaxAdjustmentExceededError extends Error {}

/** Parameters for the layout process. A part of {@link TexLinebreakOptions}. */
export interface LineBreakingOptions {
  /**
   * A factor indicating the maximum amount by which items in a line can be spaced
   * out by expanding `Glue` items.
   *
   * The maximum size which a `Glue` on a line can expand to is `glue.width +
   * (maxAdjustmentRatio * glue.stretch)`.
   *
   * If the paragraph cannot be laid out without exceeding this threshold then a
   * `MaxAdjustmentExceededError` error is thrown. The caller can use this to apply
   * hyphenation and try again. If `null`, lines are stretched as far as necessary.
   */
  maxAdjustmentRatio: number | null;

  /** The maximum adjustment ratio used for the initial line breaking attempt. */
  initialMaxAdjustmentRatio: number;

  /** Penalty for consecutive hyphenated lines. */
  doubleHyphenPenalty: number;

  /** Penalty for significant differences in the tightness of adjacent lines. */
  adjacentLooseTightPenalty: number;
}
export const defaultLineBreakingOptions: LineBreakingOptions = {
  maxAdjustmentRatio: null,
  initialMaxAdjustmentRatio: 1,
  doubleHyphenPenalty: 0,
  adjacentLooseTightPenalty: 0,
};

/**
 * Break a paragraph of text into justified lines.
 *
 * Returns the indexes from `items` which have been chosen as breakpoints.
 * `positionBoxes` can be used to generate the X offsets and line numbers
 * of each box using the resulting breakpoints.
 *
 * May throw an `Error` if valid breakpoints cannot be found given the
 * specified adjustment ratio thresholds.
 *
 * The implementation uses the "TeX algorithm" from [1].
 *
 * [1] D. E. Knuth and M. F. Plass, “Breaking paragraphs into lines,” \
 * Softw. Pract. Exp., vol. 11, no. 11, pp. 1119–1184, Nov. 1981.
 *
 * @param items - Sequence of box, glue and penalty items to layout.
 * @param lineWidths - Length or lengths of each line.
 * @param _options
 */
export function breakLines(
  items: Item[],
  lineWidths: LineWidth,
  _options: Partial<LineBreakingOptions> = {},
): number[] {
  if (items.length === 0) return [];

  /** Validate input */
  const lastItem = items[items.length - 1];
  if (!(lastItem.type === 'penalty' && lastItem.cost <= MIN_COST)) {
    throw new Error(
      `The last item in breakLines must be a penalty of cost MIN_COST, otherwise the last line will not be broken.`,
    );
  }

  const options: LineBreakingOptions = { ...defaultLineBreakingOptions, ..._options };

  const currentMaxAdjustmentRatio = Math.min(
    options.initialMaxAdjustmentRatio,
    options.maxAdjustmentRatio !== null ? options.maxAdjustmentRatio : Infinity,
  );

  type LineBreakingNode = {
    index: number; // Index in `items`.
    line: number; // Line number.
    fitness: number;
    // Sum of `width` up to first box or forced break after this break.
    totalWidth: number;
    // Sum of `stretch` up to first box or forced break after this break.
    totalStretch: number;
    // Sum of `shrink` up to first box or forced break after this break.
    totalShrink: number;
    // Minimum sum of demerits up this break.
    totalDemerits: number;
    prev: null | LineBreakingNode;
  };

  const active = new Set<LineBreakingNode>();

  // Add initial active node for beginning of paragraph.
  active.add({
    index: 0,
    line: 0,
    // Fitness is ignored for this node.
    fitness: 0,
    totalWidth: 0,
    totalStretch: 0,
    totalShrink: 0,
    totalDemerits: 0,
    prev: null,
  });

  // Sum of `width` of items up to current item.
  let sumWidth = 0;
  // Sum of `stretch` of glue items up to current item.
  let sumStretch = 0;
  // Sum of `shrink` of glue items up to current item.
  let sumShrink = 0;

  let minAdjustmentRatioAboveThreshold = Infinity;

  for (let b = 0; b < items.length; b++) {
    const item = items[b];

    /**
     * TeX allows items with negative widths or stretch factors but imposes two
     * restrictions for efficiency. These restrictions are not yet implemented here and
     * we avoid the problem by just disallowing negative width/shrink/stretch amounts.
     */
    if (item.width < 0) {
      throw new Error(`Item ${b} has disallowed negative width`);
    }

    /**
     * Determine if this is a feasible breakpoint and
     * update `sumWidth`, `sumStretch` and `sumShrink`.
     */
    let canBreak = false;
    if (item.type === 'box') {
      sumWidth += item.width;
    } else if (item.type === 'glue') {
      if (item.shrink < 0 || item.stretch < 0) {
        throw new Error(`Item ${b} has disallowed negative stretch or shrink`);
      }

      canBreak = b > 0 && items[b - 1].type === 'box';
      if (!canBreak) {
        sumWidth += item.width;
        sumShrink += item.shrink;
        sumStretch += item.stretch;
      }
    } else if (item.type === 'penalty') {
      canBreak = item.cost < MAX_COST;
    }
    if (!canBreak) {
      continue;
    }

    /** Update the set of active nodes. */
    let lastActive: LineBreakingNode | null = null;

    const feasible: LineBreakingNode[] = [];
    active.forEach((a) => {
      const lineShrink = sumShrink - a.totalShrink;
      let lineStretch = sumStretch - a.totalStretch;
      const idealLen = getLineWidth(lineWidths, a.line);
      let actualLen = sumWidth - a.totalWidth;

      /**
       * NOTE:
       * This goes against the original paper, but it simply does not work
       * correctly when the text includes an item that fills the entire line.
       * In that case, the adjustment ratio is infinite, the line can never
       * be broken, causing one of two things to occur:
       *
       * 1. The word OVERLAPS with the next one
       * 2. The line is split in an extremely silly manner, such as \
       * "bla bla bla \
       * bla https://example.com/bla- \
       * bla" \
       * instead of: \
       * "bla bla bla bla \
       * https://example.com/bla-bla" \
       */
      if (lineStretch === 0) {
        lineStretch = 1;
      }

      /** Include width of penalty in line length if chosen as a breakpoint. */
      if (item.type === 'penalty') {
        actualLen += item.width;
      }

      /** Compute adjustment ratio from `a` to `b`. */
      let adjustmentRatio;
      if (actualLen === idealLen) {
        adjustmentRatio = 0;
      } else if (actualLen < idealLen) {
        /** Nb. Division by zero produces `Infinity` here, which is what we want. */
        adjustmentRatio = (idealLen - actualLen) / lineStretch;
      } else {
        adjustmentRatio = (idealLen - actualLen) / lineShrink;
      }
      if (adjustmentRatio > currentMaxAdjustmentRatio) {
        /**
         * In case we need to try again later with a higher `maxAdjustmentRatio`,
         * track the minimum value needed to produce different output.
         */
        minAdjustmentRatioAboveThreshold = Math.min(
          adjustmentRatio,
          minAdjustmentRatioAboveThreshold,
        );
      }

      if (adjustmentRatio < MIN_ADJUSTMENT_RATIO || isForcedBreak(item)) {
        /** Items from `a` to `b` cannot fit on one line. */
        active.delete(a);
        lastActive = a;
      }
      if (adjustmentRatio >= MIN_ADJUSTMENT_RATIO && adjustmentRatio <= currentMaxAdjustmentRatio) {
        /**
         * We found a feasible breakpoint. Compute a
         * `demerits` score for it as per formula on p. 1128.
         */
        let demerits;
        const badness = 100 * Math.abs(adjustmentRatio) ** 3;
        const penalty = item.type === 'penalty' ? item.cost : 0;

        if (penalty >= 0) {
          demerits = (1 + badness + penalty) ** 2;
        } else if (penalty > MIN_COST) {
          demerits = (1 + badness) ** 2 - penalty ** 2;
        } else {
          demerits = (1 + badness) ** 2;
        }

        let doubleHyphenPenalty = 0;
        const prevItem = items[a.index];
        if (item.type === 'penalty' && prevItem.type === 'penalty') {
          if (item.flagged && prevItem.flagged) {
            doubleHyphenPenalty = options.doubleHyphenPenalty;
          }
        }
        demerits += doubleHyphenPenalty;

        /** Fitness classes are defined on p. 1155 */
        let fitness;
        if (adjustmentRatio < -0.5) {
          fitness = 0;
        } else if (adjustmentRatio < 0.5) {
          fitness = 1;
        } else if (adjustmentRatio < 1) {
          fitness = 2;
        } else {
          fitness = 3;
        }
        if (a.index > 0 && Math.abs(fitness - a.fitness) > 1) {
          demerits += options.adjacentLooseTightPenalty;
        }

        /**
         * If this breakpoint is followed by glue or non-breakable penalty items
         * then we don't want to include the width of those when calculating the
         * width of lines starting after this breakpoint. This is because when
         * rendering we ignore glue/penalty items at the start of lines.
         */
        let widthToNextBox = 0;
        let shrinkToNextBox = 0;
        let stretchToNextBox = 0;
        for (let bp = b; bp < items.length; bp++) {
          const item = items[bp];
          if (item.type === 'box') {
            break;
          }
          if (item.type === 'penalty' && item.cost >= MAX_COST) {
            break;
          }
          widthToNextBox += item.width;
          if (item.type === 'glue') {
            shrinkToNextBox += item.shrink;
            stretchToNextBox += item.stretch;
          }
        }

        feasible.push({
          index: b,
          line: a.line + 1,
          fitness,
          totalWidth: sumWidth + widthToNextBox,
          totalShrink: sumShrink + shrinkToNextBox,
          totalStretch: sumStretch + stretchToNextBox,
          totalDemerits: a.totalDemerits + demerits,
          prev: a,
        });
      }
    });

    /** Add feasible breakpoint with lowest score to active set. */
    if (feasible.length > 0) {
      let bestNode = feasible[0];
      for (let f of feasible) {
        if (f.totalDemerits < bestNode.totalDemerits) {
          bestNode = f;
        }
      }
      active.add(bestNode);
    }

    /**
     * Handle situation where there is no way to break the paragraph without
     * shrinking or stretching a line beyond [-1, currentMaxAdjustmentRatio].
     */
    if (active.size === 0) {
      if (isFinite(minAdjustmentRatioAboveThreshold)) {
        if (options.maxAdjustmentRatio === currentMaxAdjustmentRatio) {
          throw new MaxAdjustmentExceededError();
        }
        /**
         * Too much stretching was required for an earlier ignored breakpoint.
         * Try again with a higher threshold.
         */
        return breakLines(items, lineWidths, {
          ..._options,
          initialMaxAdjustmentRatio: minAdjustmentRatioAboveThreshold * 2,
        });
      } else {
        /**
         * We cannot create a breakpoint sequence by increasing the max adjustment ratio. This
         * could happen if a box is too wide or there are glue items with zero stretch/shrink.
         *
         * Give up and create a breakpoint at the current position.
         */
        active.add({
          index: b,
          line: lastActive!.line + 1,
          fitness: 1,
          totalWidth: sumWidth,
          totalShrink: sumShrink,
          totalStretch: sumStretch,
          totalDemerits: lastActive!.totalDemerits + 1000,
          prev: lastActive!,
        });
      }
    }

    if (item.type === 'glue') {
      sumWidth += item.width;
      sumStretch += item.stretch;
      sumShrink += item.shrink;
    }
  }

  /**
   * Choose active node with fewest total demerits as the last breakpoint.
   *
   * There should always be an active node at this point since:
   *
   * 1. We add a node to the active set before entering the loop.
   * 2. Each iteration of the loop either returns from the function, leaves the active
   * set unchanged and breaks early or finishes with a non-empty active set.
   */
  let bestNode: LineBreakingNode | null = null;
  active.forEach((a) => {
    if (!bestNode || a.totalDemerits < bestNode.totalDemerits) {
      bestNode = a;
    }
  });

  /** Follow the chain backwards from the chosen node to get the sequence of chosen breakpoints. */
  const output = [];
  let next: LineBreakingNode | null = bestNode!;
  while (next) {
    output.push(next.index);
    next = next.prev;
  }
  output.reverse();

  return output;
}

export const getLineWidth = (lineWidths: LineWidth, lineIndex: number): number => {
  if (Array.isArray(lineWidths)) {
    if (lineIndex < lineWidths.length) {
      return lineWidths[lineIndex];
    } else {
      /**
       * If out of bounds, return the last width of the last line.
       * This is done since the first line may have indentation.
       */
      return lineWidths.at(-1)!;
    }
  } else if (typeof lineWidths === 'number') {
    return lineWidths;
  } else {
    return lineWidths[lineIndex] || lineWidths.defaultLineWidth;
  }
};
