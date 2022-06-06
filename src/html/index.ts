import { visualizeBoxesForDebugging } from "src/html/debugging";
import DOMTextMeasurer from "src/html/domTextMeasurer";
import { DOMItem, getItemsFromDOM } from "src/html/getItemsFromDOM";
import { getFloatingElements } from "src/html/htmlUtils";
import { getElementLineWidth } from "src/html/lineWidth";
import { listenForWindowResize } from "src/html/listener";
import { getTaggedChildren, tagNode } from "src/html/tagNode";
import { TexLinebreak } from "src/index";
import { getOptionsWithDefaults, TexLinebreakOptions } from "src/options";
import { SOFT_HYPHEN } from "src/splitTextIntoItems/splitTextIntoItems";

/**
 * Break the lines of HTML elements.
 *
 * @param _elements - Can be a query selector string or a list of elements.
 */
export function texLinebreakDOM(
  _elements: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  _options: Partial<TexLinebreakOptions>,
  debug = false
) {
  const options = getOptionsWithDefaults({
    ..._options,
    collapseNewlines: true,
  });

  let elements: HTMLElement[];
  if (typeof _elements === "string") {
    elements = Array.from(document.querySelectorAll(_elements));
  } else if (_elements instanceof NodeList) {
    elements = Array.from(_elements);
  } else if (!Array.isArray(_elements)) {
    elements = [_elements];
  } else {
    return console.error("texLinebreakDOM didn't receive any items");
  }

  const domTextMeasureFn = new DOMTextMeasurer().measure;
  const floatingElements = getFloatingElements();

  elements.forEach((element) => {
    /** Undo the changes made by any previous justification of this content. */
    resetDOMJustification(element);
    try {
      const lineWidth =
        options.lineWidth || getElementLineWidth(element, floatingElements);
      const items = getItemsFromDOM(
        element,
        { ...options, lineWidth },
        domTextMeasureFn
      );

      /** Disable automatic line wrap. */
      element.style.whiteSpace = "nowrap";

      const lines = new TexLinebreak<DOMItem>(items, {
        ...options,
        lineWidth,
        collapseNewlines: true,
      }).lines;

      // console.log(items);
      console.log(lines);

      /**
       * Since `Range`s are fragile and will easily go out of sync when we make
       * changes to the DOM, we go through the lines in a reverse order. We
       * also only alter one item at a time instead of wrapping the entire line.
       */
      lines
        .slice()
        .reverse()
        .forEach((line) => {
          const items = line.positionedItems;
          const itemRanges = items.map(getRangeOfItem);

          const firstBoxInLine = items.find((item) => item.type === "box");
          const lastBoxInLine = items
            .slice()
            .reverse()
            .find((item) => item.type === "box");
          if (!firstBoxInLine || !lastBoxInLine) {
            console.log({ items_in_line: line.items });
            console.warn("Line has no box");
            return;
          }
          const firstBoxRange = getRangeOfItem(firstBoxInLine);
          const lastBoxRange = getRangeOfItem(lastBoxInLine);

          let curXOffset = 0;

          /**
           * Loops over items and adjusts the spacing of glues and position
           * of boxes.
           *
           * The position of boxes currently only makes adjustments in the
           * case of boxes of a negative width (which represent a backspace,
           * used for left hanging punctuation), however those boxes are not
           * displayed, but they affect the boxes that come after them.
           */
          items.forEach((item, index) => {
            const itemRange = itemRanges[index];

            /** Add spacing to glue */
            if (item.type === "glue") {
              const span = tagNode(document.createElement("span"));
              /**
               * A glue cannot be `inline-block` since that messes with the
               * formatting of links (each word gets its own underline)
               */
              span.style.wordSpacing = `${item.adjustedWidth - item.width}px`;
              itemRange.surroundContents(span);
            } else if (item.type === "box") {
              /**
               * If xOffset is not curXOffset, that means that a
               * previous box has had a negative width. Here we wrap the
               * text in a span with a (likely negative) left margin
               */
              if (item.xOffset !== curXOffset) {
                const span = tagNode(document.createElement("span"));
                span.style.marginLeft = `${item.xOffset - curXOffset}px`;
                itemRange.insertNode(span);
                curXOffset = item.xOffset;
              }

              // if (options.stripSoftHyphensFromOutputText) {
              //   stripSoftHyphensFromOutputText(itemRange);
              // }
            }

            /** Todo: negative glue? */
            if (item.adjustedWidth > 0) {
              curXOffset += item.adjustedWidth;
            }
          });

          /** Insert <br/> elements to separate the lines */
          if (line.lineIndex > 0) {
            firstBoxRange.insertNode(tagNode(document.createElement("br")));
          }

          /** Add soft hyphens */
          if (line.endsWithSoftHyphen && lastBoxRange) {
            const wrapperAroundFinalBox = tagNode(
              document.createElement("span")
            );
            lastBoxRange.surroundContents(wrapperAroundFinalBox);

            let hyphen: HTMLElement | Text;
            let hyphenText = "-";
            if (options.softHyphenOutput === "HTML_UNCOPYABLE_HYPHEN") {
              hyphenText = "";
            } else if (
              options.softHyphenOutput ===
                "HTML_UNCOPYABLE_HYPHEN_WITH_SOFT_HYPHEN" ||
              options.softHyphenOutput === "SOFT_HYPHEN"
            ) {
              hyphenText = SOFT_HYPHEN;
            }

            if (
              options.softHyphenOutput === "HTML_UNCOPYABLE_HYPHEN" ||
              options.softHyphenOutput ===
                "HTML_UNCOPYABLE_HYPHEN_WITH_SOFT_HYPHEN"
            ) {
              /**
               * Create a wrapper element that displays the
               * hyphen as an uncopiable CSS pseudo-element
               */
              hyphen = tagNode(document.createElement("span"));
              hyphen.appendChild(tagNode(document.createTextNode(hyphenText)));
              hyphen.dataset.uncopiableText = "-";
            } else {
              hyphen = tagNode(document.createTextNode(hyphenText));
            }

            wrapperAroundFinalBox.appendChild(hyphen);
          }
        });

      if (debug) visualizeBoxesForDebugging(lines, element);
    } catch (e) {
      /**
       * In the case of an error, we undo any changes we may have
       * made so that the user isn't left with a broken document.
       * (Todo: Test if this actually works)
       */
      console.error(e);
      resetDOMJustification(element);
    }
  });

  listenForWindowResize(elements);

  /** Add CSS to handle uncopiable hyphens */
  if (
    options.softHyphenOutput === "HTML_UNCOPYABLE_HYPHEN" ||
    options.softHyphenOutput === "HTML_UNCOPYABLE_HYPHEN_WITH_SOFT_HYPHEN"
  ) {
    if (
      document.querySelector("[data-uncopiable-text]") &&
      !document.querySelector("style#tex-linebreak-uncopiable-text")
    ) {
      const style = document.createElement("style");
      style.id = "tex-linebreak-uncopiable-text";
      style.innerHTML =
        "[data-uncopiable-text]::after{content: attr(data-uncopiable-text);}";
      document.head.appendChild(style);
    }
  }
}

/** Reverse the changes made to an element by {@link texLinebreakDOM}. */
export function resetDOMJustification(element: HTMLElement) {
  // Find and remove all elements inserted by `justifyContent`.
  const tagged = getTaggedChildren(element);
  for (let node of tagged) {
    const parent = node.parentNode!;
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      parent.insertBefore(child, node);
    });
    parent.removeChild(node);
  }

  // Re-join text nodes that were split by `justifyContent`.
  element.normalize();

  element.style.whiteSpace = "initial";
}

export const getRangeOfItem = (item: DOMItem): Range => {
  const range = document.createRange();
  range.setStart(item.startContainer, item.startOffset);
  range.setEnd(item.endContainer, item.endOffset);
  return range;
};
