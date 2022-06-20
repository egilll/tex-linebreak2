import {
  Glue,
  INFINITE_STRETCH,
  Item,
  MAX_COST,
  MIN_COST,
  Penalty,
} from "src/breakLines";
import { DOMItem } from "src/html/getItemsFromDOM";
import { TemporaryControlItem } from "src/html/getItemsFromDOM/controlItems";
import { TemporaryUnprocessedTextNode } from "src/html/getItemsFromDOM/textNodes";
import { TexLinebreakOptions } from "src/options";
import { glue, penalty } from "src/utils/items";
import { getMaxLineWidth } from "src/utils/lineWidth";

export function getSpaceWidth(options: TexLinebreakOptions): number {
  return options.measureFn(" ");
}

export function getLineFinalStretchInNonJustified(
  options: TexLinebreakOptions
): number {
  return getSpaceWidth(options) * options.lineFinalSpacesInNonJustified;
}

/** Todo: Should regular hyphens not be flagged? If so this function doesn't work */
export function isSoftHyphen(item: Item | undefined): boolean {
  // Note: Do not take width into account here as it will be zero for hanging punctuation
  return Boolean(item && item.type === "penalty" && item.flagged);
}

export function isForcedBreak(item: Item) {
  return item && item.type === "penalty" && item.cost <= MIN_COST;
}

export function isNonForcedBreak(item: Item) {
  return item && item.type === "penalty" && item.cost > MIN_COST;
}

export function isBreakablePenalty(item: Item) {
  return item && item.type === "penalty" && item.cost < MAX_COST;
}

export function isNonBreakablePenalty(item: Item) {
  return item && item.type === "penalty" && item.cost >= MAX_COST;
}

export function isPenaltyThatDoesNotForceBreak(item: Item) {
  return item && item.type === "penalty" && item.cost > MIN_COST;
}

export function getText(
  input: DOMItem | TemporaryUnprocessedTextNode | TemporaryControlItem
): string {
  return (typeof input === "object" && "text" in input && input.text) || "";
}

/**
 * Gets the stretch of a glue, taking into account the setting
 * {@link TexLinebreakOptions#infiniteGlueStretchAsRatioOfWidth}
 */
export function getStretch(input: Glue, options: TexLinebreakOptions): number {
  if (
    input.stretch === INFINITE_STRETCH &&
    options.infiniteGlueStretchAsRatioOfWidth != null
  ) {
    return (
      options.infiniteGlueStretchAsRatioOfWidth *
      getMaxLineWidth(options.lineWidth)
    );
  } else {
    return input.stretch;
  }
}

/**
 * todo: this adds line-final glue for justified but it should
 * be marked as just extending whatever stretch there already is
 */
export function addSlackIfBreakpoint(
  stretch: number,
  cost: number = 0
): (Glue | Penalty)[] {
  return [
    penalty(0, MAX_COST),
    glue(0, stretch, 0),
    penalty(0, cost),
    glue(0, -stretch, 0),
  ];
}

export const infiniteGlue = (): Glue => {
  return glue(0, INFINITE_STRETCH, 0);
};

export function validateItems(items: Item[]) {
  if (!items) {
    throw new Error("Didn't receive any items");
  }

  /** Input has to end in a MIN_COST penalty */
  const lastItem = items[items.length - 1];
  if (!(lastItem.type === "penalty" && lastItem.cost <= MIN_COST)) {
    console.log(items);
    console.log(items.slice(-3));
    throw new Error(
      "The last item in breakLines must be a penalty of MIN_COST, otherwise the last line will not be broken. `splitTextIntoItems` will automatically as long as the `addParagraphEnd` option hasn't been turned off."
    );
  }

  /**
   * Catch a misunderstanding of someone trying to penalize a
   * glue (accidentally placing the penalty after the glue)
   */
  const gluePenaltyBoxIndex = items.findIndex(
    (item, index) =>
      item.type === "glue" &&
      items[index + 1].type === "penalty" &&
      (items[index + 1] as Penalty).cost! > MIN_COST &&
      items[index + 2].type === "box"
  );
  if (gluePenaltyBoxIndex >= 0) {
    console.log({ items });
    console.log(items.slice(gluePenaltyBoxIndex - 2, gluePenaltyBoxIndex + 5));
    throw new Error(
      `It appears you're trying to penalize a glue at index ${gluePenaltyBoxIndex}, but remember that penalty comes before the glue.`
    );
  }

  /** Validate values */
  if (items.some((item) => !item.type)) {
    throw new Error(
      `Missing type for item: ${JSON.stringify(
        items.find((item) => !item.type)
      )}`
    );
  }

  let nonNumber = items.find(
    (item) => typeof item.width !== "number" || isNaN(item.width)
  );
  if (nonNumber) {
    console.log(items);
    throw new Error(
      `Width must be a number, got ${typeof nonNumber} (${JSON.stringify(
        nonNumber
      )})`
    );
  }
  if (items.some((item) => item.type === "glue" && !isFinite(item.stretch))) {
    throw new Error(`Glue cannot have infinite stretch`);
  }
}

/** Used for inline-block elements where glue has to expand but nothing can break */
export function makeNonBreaking(
  items: Item[],
  startIndex: number,
  endIndex: number
) {
  for (let i = startIndex; i < endIndex; i++) {
    if (items[i].type === "penalty") {
      (items[i] as Penalty).cost = MAX_COST;
    }
    if (items[i].type === "glue" && items[i - 1]?.type === "box") {
      // Insert a penalty item before this item
      items.splice(i, 0, penalty(0, MAX_COST));
      i++;
    }
  }
}

export function removeGlueAtEnd(items: Item[]): Item[] {
  const itemsReversed = items.slice().reverse();
  return itemsReversed
    .slice(itemsReversed.findIndex((item) => item.type !== "glue"))
    .reverse();
}
