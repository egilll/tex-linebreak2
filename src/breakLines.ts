import {
  getOptionsWithDefaults,
  RequireOnlyCertainKeys,
  TexLinebreakOptions,
} from "src/options";
import { penalty } from "src/utils/items";
import { getLineWidth } from "src/utils/lineWidth";
import {
  getStretch,
  isBreakablePenalty,
  isForcedBreak,
  validateItems,
} from "src/utils/utils";

/** An object (e.g. a word) to be typeset. */
export interface Box {
  type: "box";
  /** Amount of space required by this content. */
  width: number;
}

/**
 * A space between `Box` items with a preferred
 * width and some capacity to stretch or shrink.
 *
 * `Glue` items are candidates for breakpoints
 * only if they immediately follow a `Box`.
 */
export interface Glue {
  type: "glue";
  /** Preferred width of this space. */
  width: number;
  /**
   * Maximum amount by which this space can grow (given a
   * maxAdjustmentRatio of 1), expressed in the same units as `width`.
   * A `width` of 5 and a `stretch` of 1 means that the glue can have
   * a width of 6. A value of 0 means that it cannot stretch.
   */
  stretch: number;
  /**
   * Maximum amount by which this space can shrink, expressed in
   * the same units as `width`.
   * Unlike `stretch` which can expand as we increase the
   * maxAdjustmentRatio, a glue is forbidden from shrinking more
   * than this value (since {@link TexLinebreakOptions#minAdjustmentRatio} is `-1`).
   * A `width` of 5 and a `shrink` of 1 means that the glue can
   * have a width of 4. A value of 0 means that it cannot shrink.
   */
  shrink: number;
}

/** An explicit candidate position for breaking a line. */
export interface Penalty {
  type: "penalty";

  /**
   * Amount of space required for typeset content to be added
   * (eg. a hyphen) if a line is broken here. Must be >= 0.
   */
  width: number;
  /**
   * The undesirability of breaking the line at this point.
   * Values <= `MIN_COST` and >= `MAX_COST` mandate or
   * prevent breakpoints respectively.
   */
  cost: number;
  /**
   * A hint used to prevent successive lines being broken
   * with hyphens. The layout algorithm will try to avoid
   * successive lines being broken at flagged `Penalty` items.
   */
  flagged?: boolean;
}

export type Item = Box | Penalty | Glue;

/**
 * Maximum cost for a breakpoint.
 *
 * A value >= `MAX_COST` prevents a break.
 * Has a value of 1000 in the original paper, but it is useful to have penalties that are more costly than that.
 */
export const MAX_COST = 1e7;

/**
 * Minimum cost for a breakpoint.
 *
 * A value <= `MIN_COST` forces a break.
 * Has a value of -1000 in the original paper
 */
export const MIN_COST = -1e7;

export const INFINITE_STRETCH = 100000;

/** Error thrown by `breakLines` when `maxAdjustmentRatio` is exceeded. */
export class MaxAdjustmentExceededError extends Error {}

/**
 * Used internally by {@link breakLines}.
 * A line-breaking node either represents a glue or a penalty.
 */
export type LineBreakingNode = {
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
 * {@link TexLinebreakOptions#preventSingleWordLines}.
 *
 * @param items - Sequence of box, glue and penalty items to layout.
 * @param _options - The following options are used here:
 *       {@link TexLinebreakOptions#maxAdjustmentRatio}
 *       {@link TexLinebreakOptions#initialMaxAdjustmentRatio}
 *       {@link TexLinebreakOptions#doubleHyphenPenalty}
 *       {@link TexLinebreakOptions#adjacentLooseTightPenalty}
 *       {@link TexLinebreakOptions#preventSingleWordLines}
 * @param currentRecursionDepth - Used internally to keep track of how often this function has called itself
 *       (done when increasing the allowed adjustment ratio).
 */
export function breakLines(
  items: Item[],
  _options: RequireOnlyCertainKeys<TexLinebreakOptions, "lineWidth">,
  currentRecursionDepth = 0
): { breakpoints: number[]; lineBreakingNodes: LineBreakingNode[] } {
  const options = getOptionsWithDefaults(_options);

  /** Validate input (if this is the first time the function is called) */
  if (options.validateItems && currentRecursionDepth === 0) {
    validateItems(items);
  }

  const currentMaxAdjustmentRatio = Math.min(
    options.initialMaxAdjustmentRatio,
    options.maxAdjustmentRatio !== null ? options.maxAdjustmentRatio : Infinity
  );

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
    const isLastItem = b === items.length - 1;

    /**
     * Determine if this is a feasible breakpoint and
     * update `sumWidth`, `sumStretch` and `sumShrink`.
     */
    let canBreak = false;
    if (item.type === "box") {
      sumWidth += item.width;
    } else if (item.type === "glue") {
      /**
       * Only glue that comes immediately after a
       * box is a possible breakpoint (p. 1158).
       */
      canBreak = b > 0 && items[b - 1].type === "box";
      /**
       * If the glue cannot break, we add its width
       * here since the main loop will not run.
       * However, for glue that can break, we add
       * its width at the end of the main loop.
       */
      if (!canBreak) {
        sumWidth += item.width;
        sumShrink += item.shrink;
        sumStretch += getStretch(item, options);
      }
    } else if (item.type === "penalty") {
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
    active.forEach((a: LineBreakingNode) => {
      let lineShrink = sumShrink - a.totalShrink;
      let lineStretch = sumStretch - a.totalStretch;

      /**
       * NOTE: This deviates the original paper, but without it
       * the output is very counter-intuitive. See the comments
       * at {@link TexLinebreakOptions#preventSingleWordLines}.
       */
      if (
        !options.preventSingleWordLines
        // Todo: This didn't work with "\n\n"
        // &&
        // /** Are there any boxes in this line? */
        // items.slice(a.index, b).some((item) => item.type === "box")
      ) {
        if (lineStretch === 0) {
          lineStretch = 0.1;
        }
        if (lineShrink === 0) {
          lineShrink = 0.1;
        }
      }

      const idealLen = getLineWidth(options.lineWidth, a.line, options);
      let actualLen = sumWidth - a.totalWidth;

      /** Include width of penalty in line length if chosen as a breakpoint. */
      if (item.type === "penalty") {
        actualLen += item.width;
      }

      /** Adjustment ratio from `a` to `b`. */
      let adjustmentRatio;
      if (actualLen === idealLen) {
        adjustmentRatio = 0;
      } else if (actualLen < idealLen) {
        if (lineStretch > 0) {
          adjustmentRatio = (idealLen - actualLen) / lineStretch;
        } else {
          adjustmentRatio = Infinity;
        }
      } else {
        if (lineShrink > 0) {
          adjustmentRatio = (idealLen - actualLen) / lineShrink;
        } else {
          adjustmentRatio = Infinity;
        }
      }
      if (adjustmentRatio > currentMaxAdjustmentRatio) {
        /**
         * In case we need to try again later with a
         * higher `maxAdjustmentRatio`, track the minimum
         * value needed to produce different output.
         */
        minAdjustmentRatioAboveThreshold = Math.min(
          adjustmentRatio,
          minAdjustmentRatioAboveThreshold
        );
      }

      /**
       * Check whether items from `a` to `b` can fit
       * on one line, if not, remove the active node.
       */
      if (
        adjustmentRatio < options.minAdjustmentRatio ||
        isForcedBreak(item) ||
        /**
         * Restriction no. 1 on negative breaks. (See page 1156,
         * http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf#page=38)
         *
         * The total width up to `a` cannot be larger than the total width up
         * to `b`.
         *
         * Todo: Test, and verify that it is totalWidth that we're discussing.
         */
        a.totalWidth > sumWidth ||
        /**
         * Restriction no. 2 on negative breaks:
         *
         * If no item between `a` and `b` is a box or
         * a forced break, then `b` has to either
         *
         * - Be the last item, or
         * - Be followed by a box or breakable penalty.
         */
        // No item between `a` and `b` is a box or forced break
        (!items
          .slice(a.index, b)
          .some((i) => i.type === "box" || isForcedBreak(i)) &&
          !(
            isLastItem || // Is the last item
            items[b + 1].type === "box" || // Is followed by a box
            // Is followed by a breakable penalty
            isBreakablePenalty(items[b + 1])
          ))
      ) {
        active.delete(a);
        lastActive = a;
      }

      if (
        adjustmentRatio >= options.minAdjustmentRatio &&
        adjustmentRatio <= currentMaxAdjustmentRatio
      ) {
        /**
         * We found a feasible breakpoint. Compute a
         * `demerits` score for it as per formula on p. 1128.
         */
        let demerits;
        const badness = 100 * Math.abs(adjustmentRatio) ** 3;
        const penalty =
          item.type === "penalty" ? item.cost * options.penaltyMultiplier : 0;

        if (penalty >= 0) {
          demerits = (1 + badness + penalty) ** 2;
        } else if (penalty > MIN_COST) {
          demerits = (1 + badness) ** 2 - penalty ** 2;
        } else {
          demerits = (1 + badness) ** 2;
        }

        /** Double hyphen penalty */
        const prevItem = items[a.index];
        if (item.type === "penalty" && prevItem.type === "penalty") {
          if (item.flagged && prevItem.flagged) {
            demerits += options.doubleHyphenPenalty;
          }
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
        // Todo: Verify, per https://github.com/robertknight/tex-linebreak/pull/4
        for (let bp = b === 0 ? b : b + 1; bp < items.length; bp++) {
          const item = items[bp];
          if (item.type === "box") {
            break;
          }
          if (item.type === "penalty" && item.cost >= MAX_COST) {
            break;
          }
          widthToNextBox += item.width;
          if (item.type === "glue") {
            shrinkToNextBox += item.shrink;
            stretchToNextBox += getStretch(item, options);
          }
        }

        // Work in progress. Does not work since we discard sub-optimal former lines.
        // if (isLastItem && options.maxLines) {
        //   if (a.line + 1 > options.maxLines) {
        //     demerits = Infinity;
        //   }
        //   if (options.fillAllLines) {
        //     demerits += (options.maxLines - (a.line + 1)) ** 10;
        //   }
        // }

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
      const bestNode = feasible.reduce((a, b) => {
        return a.totalDemerits < b.totalDemerits ? a : b;
      });
      active.add(bestNode);

      // for (const node of feasible) {
      //   // if(node !== bestNode) {
      //   active.add(node);
      //   // }
      // }
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
        return breakLines(
          items,
          new TexLinebreakOptions({
            ...options,
            /**
             * Increase `initialMaxAdjustmentRatio`.
             *
             * "+ 0.3" makes sure we don't increase too little, and basing
             * it on `currentRecursionDepth` prevents excessive recursion.
             */
            initialMaxAdjustmentRatio:
              currentRecursionDepth < 10
                ? Math.max(
                    minAdjustmentRatioAboveThreshold,
                    options.initialMaxAdjustmentRatio + 0.3
                  )
                : Infinity, // TODO: Is this sub-optimal?
          }),
          currentRecursionDepth + 1
        );
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

    /** The widths of boxes and non-breakable glues were already added above */
    if (item.type === "glue") {
      sumWidth += item.width;
      sumStretch += getStretch(item, options);
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
  const chosenNodes: LineBreakingNode[] = [];
  let next: LineBreakingNode | null = bestNode!;
  while (next) {
    chosenNodes.unshift(next);
    next = next.prev;
  }

  if (chosenNodes.at(-1)?.totalDemerits === Infinity) {
    console.warn("Total demerits were infinite");
  }

  return {
    breakpoints: chosenNodes.map((i) => i.index),
    lineBreakingNodes: chosenNodes,
  };
}
