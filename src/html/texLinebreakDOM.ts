import DOMTextMeasurer from "src/html/domTextMeasurer";
import { DOMItem, getItemsFromDOM } from "src/html/getItemsFromDOM";
import { getFloatingElements } from "src/html/htmlUtils";
import { getElementLineWidth } from "src/html/lineWidthDOM";
import { getTaggedChildren, tagNode } from "src/html/tagNode";
import { updateOnWindowResize } from "src/html/updateOnWindowResize";
import { visualizeBoxesForDebugging } from "src/html/visualizeBoxesForDebugging";
import { TexLinebreak } from "src/index";
import { getOptionsWithDefaults, TexLinebreakOptions } from "src/options";
import { SOFT_HYPHEN } from "src/splitTextIntoItems/splitTextIntoItems";
import { TextGlue } from "src/utils/items";
import { getMaxLineWidth } from "src/utils/utils";

/**
 * Breaks the lines of HTML elements and applies justification.
 *
 * @param _elements - Can be a query selector string or a list of elements.
 * @param _options
 * @param debug - Will run {@link visualizeBoxesForDebugging}.
 */
export async function texLinebreakDOM(
  _elements: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  _options: Partial<TexLinebreakOptions>,
  debug?: boolean
) {
  const options = getOptionsWithDefaults({
    preset: "html",
    ..._options,
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

  for (const element of elements) {
    /* Prevent rendering thread from hanging on large documents */
    await new Promise((resolve) => setTimeout(resolve, 0));

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

      const obj = new TexLinebreak<DOMItem>(items, {
        ...options,
        lineWidth,
        collapseAllNewlines: true,
      });
      const lines = obj.lines;

      if (process.env.NODE_ENV === "development" && window.location.hash) {
        console.log(lines);
      }

      for (const line of lines) {
        const items = line.positionedItems;

        /** Insert <br/> elements to separate the lines */
        if (line.lineIndex > 0) {
          const br = document.createElement("br");
          const firstItem = items.find((i) => i.span);
          if (firstItem) {
            const span = firstItem.span!;
            span.parentNode!.insertBefore(br, span);
          } else {
            throw new Error("No items in line");
          }
        }

        let curXOffset = 0;

        for (const item of items) {
          /** Add spacing to glue */
          if (item.type === "glue") {
            const span = item.span;
            if (!span) continue;
            if (item.skipWhenRendering) {
              span.style.display = "none";
              continue;
            }
            /**
             * We try to not use `inline-block` since that messes with
             * the formatting of links (each word gets its own underline)
             */
            if ((item as TextGlue).text) {
              span.style.wordSpacing = `${item.adjustedWidth - item.width}px`;
            } else {
              span.style.width = `${item.adjustedWidth}px`;
              span.style.display = "inline-block";
            }
            if (item.adjustedWidth <= 0) {
              span.style.fontSize = "0";
              span.style.width = "0";
              span.style.display = "inline-block";
            } else {
              curXOffset += item.adjustedWidth;
            }
          } else if (item.type === "box") {
            /**
             * If xOffset is not curXOffset, that means that a
             * previous box has had a negative width. Here we wrap the
             * text in a span with a (likely negative) left margin
             */
            if (item.xOffset !== curXOffset) {
              const span = item.span!;
              span.style.marginLeft = `${item.xOffset - curXOffset}px`;
              // itemRange.insertNode(span);
              curXOffset = item.xOffset;
            }

            // if (options.stripSoftHyphensFromOutputText) {
            //   stripSoftHyphensFromOutputText(itemRange);
            // }

            if (item.adjustedWidth > 0) {
              curXOffset += item.adjustedWidth;
            }
          }
        }

        // /** Add soft hyphens */
        // if (line.endsWithSoftHyphen) {
        //   const wrapperAroundFinalBox = tagNode(document.createElement("span"));
        //   lastBoxRange.surroundContents(wrapperAroundFinalBox);
        //   wrapperAroundFinalBox.appendChild(getHyphenElement(options));
        // }
      }

      if (options.setElementWidthToMaxLineWidth) {
        /** TODO: Include padding */
        element.style.width = `${getMaxLineWidth(obj.options.lineWidth)}px`;
      }

      if (debug) visualizeBoxesForDebugging(lines, element);
    } catch (e) {
      /**
       * In the case of an error, we undo any changes we may have
       * made so that the user isn't left with a broken document.
       */
      resetDOMJustification(element);
      throw e;
    }
  }

  if (options.updateOnWindowResize) {
    updateOnWindowResize(elements, options);
  }

  /** Add CSS to handle uncopiable hyphens */
  if (
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN" ||
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN_WITH_SOFT_HYPHEN"
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

export const getHyphenElement = (options: TexLinebreakOptions) => {
  let hyphen: HTMLElement | Text;
  let hyphenText = "-";
  if (options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN") {
    hyphenText = "";
  } else if (
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN_WITH_SOFT_HYPHEN" ||
    options.softHyphenOutput === "SOFT_HYPHEN"
  ) {
    hyphenText = SOFT_HYPHEN;
  }

  if (
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN" ||
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN_WITH_SOFT_HYPHEN"
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
  return hyphen;
};
