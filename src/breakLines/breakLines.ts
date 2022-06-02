import { Items } from 'src/items';
import { getOptionsWithDefaults, RequireOnlyCertainKeys, TexLinebreakOptions } from 'src/options';
import { getLineWidth, isForcedBreak } from 'src/utils';

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

export const INFINITE_STRETCH = Infinity;

export const MIN_ADJUSTMENT_RATIO = -1;

/** Error thrown by `breakLines` when `maxAdjustmentRatio` is exceeded. */
export class MaxAdjustmentExceededError extends Error {}

/**
 * Break a paragraph of text into justified lines.
 *
 * Returns the indexes from `items` which have been chosen as breakpoints.
 *
 * If the user has specified a {@link TexLinebreakOptions#maxAdjustmentRatio},
 * this function may throw a {@link MaxAdjustmentExceededError} if valid
 * breakpoints cannot be found.
 *
 * The implementation uses the "TeX algorithm" from:
 *
 *     D. E. Knuth and M. F. Plass, “Breaking paragraphs into lines,”
 *     Softw. Pract. Exp., vol. 11, no. 11, pp. 1119–1184, Nov. 1981.
 *     http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf
 *
 * There is a small deviation from the original paper, see the comments at
 * {@link TexLinebreakOptions#allowSingleWordLines}.
 *
 * @param items - Sequence of box, glue and penalty items to layout.
 * @param _options - The following options are used here:
 *       {@link TexLinebreakOptions#lineWidth}
 *       {@link TexLinebreakOptions#maxAdjustmentRatio}
 *       {@link TexLinebreakOptions#initialMaxAdjustmentRatio}
 *       {@link TexLinebreakOptions#doubleHyphenPenalty}
 *       {@link TexLinebreakOptions#adjacentLooseTightPenalty}
 *       {@link TexLinebreakOptions#allowSingleWordLines}
 * @param currentRecursionDepth - Used internally to keep track of how often this function has called itself
 *       (which it does after increasing the allowed adjustment ratio).
 */
export function breakLines(
  items: Items, //Item[],
  _options: RequireOnlyCertainKeys<TexLinebreakOptions, 'lineWidth'>,
  currentRecursionDepth = 0,
): number[] {
  if (items.length === 0) return [];

  /** Validate input (if this is the first time the function is called) */
  if (currentRecursionDepth === 0) {
    /** Input has to end in a MIN_COST penalty */
    if (!items.last?.isForcedBreak) {
      throw new Error(
        "The last item in breakLines must be a penalty of MIN_COST, otherwise the last line will not be broken. `splitTextIntoItems` will automatically as long as the `addParagraphEnd` option hasn't been turned off.",
      );
    }
    /** A glue cannot be followed by a non-MIN_COST penalty */
    if (items.some((item) => item.isGlue && item.next?.isPenalty && !item.next?.isForcedBreak)) {
      throw new Error(
        "A glue cannot be followed by a penalty with a cost greater than MIN_COST. If you're trying to penalize a glue, make the penalty come before it.",
      );
    }
  }

  const options = getOptionsWithDefaults(_options);

  const currentMaxAdjustmentRatio = Math.min(
    options.initialMaxAdjustmentRatio,
    options.maxAdjustmentRatio !== null ? options.maxAdjustmentRatio : Infinity,
  );

  type LineBreakingNode = {
    /** Index in `items`. */
    index: number;
    /** Line number. */
    line: number;
    fitness: number;
    /** Sum of `width` up to first box or forced break after this break. */
    totalWidth: number;
    /** Sum of `stretch` up to first box or forced break after this break. */
    totalStretch: number;
    /** Sum of `shrink` up to first box or forced break after this break. */
    totalShrink: number;
    /** Minimum sum of demerits up to this break. */
    totalDemerits: number;
    prev: null | LineBreakingNode;
  };

  /**
   * The list of "active" breakpoints represents all feasible breakpoints
   * that might be a candidate for future breaks. See page 1148.
   * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=30
   */
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

  /**
   * "Whenever a potential breakpoint `b` is encountered, the algorithm
   * tests to see if there is any active breakpoint `a` such that the
   * line from `a` to `b` has an acceptable adjustment ratio."
   */
  for (let b = 0; b < items.length; b++) {
    const item = items[b];

    /**
     * Determine if this is a feasible breakpoint and
     * update `sumWidth`, `sumStretch` and `sumShrink`.
     */
    let canBreak = false;
    if (item.isBox) {
      sumWidth += item.width;
    } else if (item.isGlue) {
      canBreak = b > 0 && item.prev!.isBox;
      if (!canBreak) {
        sumWidth += item.width;
        sumShrink += item.shrink;
        sumStretch += item.stretch;
      }
    } else if (item.isPenalty) {
      canBreak = item.cost < MAX_COST;
    }
    if (!canBreak) {
      continue;
    }

    /**
     * Used when we fail to find a suitable breaking
     * point and instead give up and break anyway.
     */
    let lastActive: LineBreakingNode | null = null;

    const feasible: LineBreakingNode[] = [];
    active.forEach((a) => {
      const lineShrink = sumShrink - a.totalShrink;
      let lineStretch = sumStretch - a.totalStretch;
      /**
       * NOTE: This deviates the original paper, but without it
       * the output is very counter-intuitive. See the comments
       * at {@link TexLinebreakOptions#allowSingleWordLines}.
       */
      if (options.allowSingleWordLines && lineStretch === 0) {
        lineStretch = 0.1;
      }

      const idealLen = getLineWidth(options.lineWidth, a.line);
      let actualLen = sumWidth - a.totalWidth;
      if (options.hangingPunctuation) {
        actualLen -= item.leftHangingPunctuationWidth || 0;
        actualLen -= item.rightHangingPunctuationWidth || 0;
      }
      /** Include width of penalty in line length if chosen as a breakpoint. */
      if (item.isPenalty) {
        actualLen += item.width;
      }

      /** TODO: wip */
      /**
       * Restriction no. 1 on negative breaks. See page 1156.
       * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=38
       */
      // const M_b = (sumWidth+actualLen)-sumShrink

      /** Compute adjustment ratio from `a` to `b`. */
      let adjustmentRatio;
      if (actualLen === idealLen) {
        adjustmentRatio = 0;
      } else if (actualLen < idealLen) {
        /**
         * Note: Division by zero produces
         * `Infinity` here, which is what we want.
         */
        adjustmentRatio = (idealLen - actualLen) / lineStretch;
      } else {
        adjustmentRatio = (idealLen - actualLen) / lineShrink;
      }
      if (adjustmentRatio > currentMaxAdjustmentRatio) {
        /**
         * In case we need to try again later with a
         * higher `maxAdjustmentRatio`, track the minimum
         * value needed to produce different output.
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
        const badness = 0.1 * Math.abs(adjustmentRatio) ** 3;
        const penalty = item.isPenalty ? item.cost : 0;

        if (penalty >= 0) {
          demerits = (1 + badness + penalty) ** 2;
        } else if (penalty > MIN_COST) {
          demerits = (1 + badness) ** 2 - penalty ** 2;
        } else {
          demerits = (1 + badness) ** 2;
        }

        if (item.flagged && item.prev!.flagged) {
          demerits += options.doubleHyphenPenalty;
        }

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
         * then we don't want to include the width of those when calculating
         * the width of lines starting after this breakpoint. This is because
         * when rendering we ignore glue/penalty items at the start of lines.
         */
        let widthToNextBox = 0;
        let shrinkToNextBox = 0;
        let stretchToNextBox = 0;
        for (let bp = b; bp < items.length; bp++) {
          const item = items[bp];
          if (item.isBox || item.isForcedBreak) {
            break;
          }
          widthToNextBox += item.width;
          if (item.isGlue) {
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
        options.initialMaxAdjustmentRatio = minAdjustmentRatioAboveThreshold * 2;
        return breakLines(items, options, currentRecursionDepth + 1);
      } else {
        /**
         * We cannot create a breakpoint sequence by increasing the
         * max adjustment ratio. This could happen if a box is too
         * wide or there are glue items with zero stretch/shrink.
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

    if (item.isGlue) {
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
   * 2. Each iteration of the loop either returns from the function,
   *    leaves the active set unchanged and breaks early or finishes with a
   *    non-empty active set.
   */
  let bestNode: LineBreakingNode | null = null;
  active.forEach((a) => {
    if (!bestNode || a.totalDemerits < bestNode.totalDemerits) {
      bestNode = a;
    }
  });

  /**
   * Follow the chain backwards from the chosen node
   * to get the sequence of chosen breakpoints.
   */
  const output = [];
  let next: LineBreakingNode | null = bestNode!;
  while (next) {
    output.push(next.index);
    next = next.prev;
  }
  output.reverse();

  return output;
}
