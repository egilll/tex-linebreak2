import DOMTextMeasurer from "src/html/DOMTextMeasurer";
import {
  DOMItem,
  getItemsFromDOMAndWrapInSpans,
} from "src/html/getItemsFromDOM";
import { getFloatingElements } from "src/html/htmlUtils";
import { getElementLineWidth } from "src/html/lineWidthDOM";
import { getTaggedChildren, tagNode } from "src/html/tagNode";
import { updateOnWindowResize } from "src/html/updateOnWindowResize";
import { visualizeBoxesForDebugging } from "src/html/visualizeBoxesForDebugging";
import { TexLinebreak } from "src/index";
import { getOptionsWithDefaults, TexLinebreakOptions } from "src/options";
import { SOFT_HYPHEN } from "src/splitTextIntoItems/splitTextIntoItems";
import { getMaxLineWidth } from "src/utils/lineWidth";

/**
 * Breaks the lines of HTML elements and applies justification.
 *
 * @param _elements - Can be a query selector string or a list of elements.
 * @param _options
 * @param debug - Will run {@link visualizeBoxesForDebugging}.
 */
export async function texLinebreakDOM(
  _elements: string | HTMLElement | HTMLElement[] | NodeListOf<HTMLElement>,
  _options?: Partial<TexLinebreakOptions>,
  debug?: boolean
) {
  const options = getOptionsWithDefaults({
    preset: ["html"],
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
    elements = _elements;
  }

  const domTextMeasureFn = new DOMTextMeasurer().measure;
  const floatingElements = getFloatingElements(options);

  addCSSForUncopiableHyphens(options);

  let elementsSeen = 0;
  for (const element of elements) {
    // if (options.dontBlockBrowserRenderingThread) {
    if (elementsSeen++ % 4 === 3) {
      /* Prevent rendering thread from hanging on large documents */
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    try {
      const lineWidth =
        options.lineWidth || getElementLineWidth(element, floatingElements);

      let items: DOMItem[];

      // /** Cache for items */ Todo: Remove soft hyphens
      // if (
      //   !options.clearItemCache &&
      //   "texLinebreakItems" in element &&
      //   (element as any)["lastTextContent"] === element.textContent
      // ) {
      //   removeInsertedBrs(element);
      //   items = (element as any)["texLinebreakItems"] as DOMItem[];
      // } else {
      /** Undo the changes made by any previous justification of this content. */
      resetDOMJustification(element);
      items = getItemsFromDOMAndWrapInSpans(
        element,
        { ...options, lineWidth },
        domTextMeasureFn
      );
      (element as any)["texLinebreakItems"] = items;
      (element as any)["lastTextContent"] = element.textContent;
      // }

      const align = getComputedStyle(element).textAlign;

      const obj = new TexLinebreak<DOMItem>(items, {
        // ...options2,
        ...options,
        // @ts-ignore
        align: options.align || align,
        lineWidth,
      });
      const lines = obj.lines;

      for (const line of lines) {
        const items = line.positionedItems;

        /** Insert <br/> elements to separate the lines */
        if (line.lineIndex > 0 && !line.prevBreakItem?.skipWhenRendering) {
          const br = tagNode(document.createElement("br"));
          // br.style.userSelect = "none";
          // // @ts-ignore
          // br.style.MozUserSelect = "none";
          // // @ts-ignore
          // br.style.WebkitUserSelect = "none";
          // // @ts-ignore
          // br.style.MsUserSelect = "none";
          const firstItem = items.find((i) => i.span);
          if (firstItem) {
            const span = firstItem.span!;
            /**
             * For inline-block elements, we have to break before that element.
             * Todo: Make work for inline elements as well, would be better to
             * break before them.
             */
            const closestBreakBeforeElement =
              span.closest(".texLinebreakNearestBlockElement") || span;
            if (!closestBreakBeforeElement.parentNode) {
              console.error("No parent node for", firstItem);
              throw new Error("No parent node");
            }
            closestBreakBeforeElement.parentNode!.insertBefore(
              br,
              closestBreakBeforeElement
            );
          } else {
            throw new Error("No items in line");
          }
        }

        let curXOffset = 0;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];

          /** Add spacing to glue */
          if (item.type === "glue") {
            const span = item.span;
            if (!span) continue;
            if (item.skipWhenRendering) {
              span.style.display = "none";
              continue;
            }

            /** Inline-block cannot be used as it strips spaces */
            span.style.fontSize = "0";
            span.style.lineHeight = "0";
            span.style.marginLeft = `${item.adjustedWidth}px`;
            curXOffset += item.adjustedWidth;
          } else if (item.type === "box") {
            const span = item.span;
            if (span && !item.skipWhenRendering) {
              /**
               * If xOffset is not curXOffset, that means that a
               * previous box has had a negative width. Here we wrap the
               * text in a span with a (likely negative) left margin
               */
              if (item.xOffset !== curXOffset) {
                span.style.marginLeft = `${item.xOffset - curXOffset}px`;
                // itemRange.insertNode(span);
                curXOffset = item.xOffset;
              } else {
                span.style.marginLeft = "0";
              }

              /**
               * Add margin to the last box of the line to prevent CSS centering to mess with our centering
               */
              if (!items.slice(i + 1).some((i) => i.type === "box")) {
                span.style.marginRight = `${
                  line.idealWidth - item.xOffset - item.adjustedWidth
                }px`;
              } else {
                span.style.marginRight = "0";
              }

              /** Strip soft hyphens (note: is destructive!) */
              if (
                options.stripSoftHyphensFromOutputText &&
                "text" in item &&
                item.text &&
                span.textContent?.includes(SOFT_HYPHEN)
              ) {
                span.textContent = span.textContent!.replaceAll(
                  SOFT_HYPHEN,
                  ""
                );
              }
            }

            if ((span || item.skipWhenRendering) && item.width > 0) {
              curXOffset += item.adjustedWidth;
            }
          }
        }

        /** Add soft hyphens */
        if (line.endsWithSoftHyphen) {
          const lastBoxInLine = items
            .slice()
            .reverse()
            .find((item) => item.type === "box" && "text" in item && item.text);
          if (lastBoxInLine) {
            lastBoxInLine.span!.appendChild(getHyphenElement(options));
          } else {
            throw new Error("No box in line");
          }
        }
      }

      if (options.setElementWidthToMaxLineWidth) {
        /** TODO: Include padding */
        element.style.width = `${getMaxLineWidth(obj.options.lineWidth)}px`;
      }

      /**
       * Disable automatic line wrap. This comes at the end since
       * the above loop can take a noticable amount of time.
       */
      element.style.whiteSpace = "nowrap";
      // element.style.visibility = "visible";

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
}

export function removeInsertedBrs(element: HTMLElement) {
  const brs = Array.from(element.querySelectorAll("br.texLinebreak"));
  for (const br of brs) {
    br.remove();
  }
}

/** Reverse the changes made to an element by {@link texLinebreakDOM}. */
export function resetDOMJustification(element: HTMLElement) {
  // Find and remove all elements inserted by `texLinebreakDOM`.
  const tagged = getTaggedChildren(element);
  for (let node of tagged) {
    const parent = node.parentNode!;
    const children = Array.from(node.childNodes);
    children.forEach((child) => {
      parent.insertBefore(child, node);
    });
    parent.removeChild(node);
  }

  // Re-join text nodes that were split by `texLinebreakDOM`.
  element.normalize();
  element.style.whiteSpace = "initial";
}

/**
 * Add CSS to handle uncopiable hyphens.
 * This has to be added at the top of the loop since
 * the loop may take a long time on large documents.
 */
export function addCSSForUncopiableHyphens(options: TexLinebreakOptions) {
  if (
    // options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN" ||
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN_WITH_SOFT_HYPHEN"
  ) {
    if (!document.querySelector("style#tex-linebreak-uncopiable-text")) {
      const style = document.createElement("style");
      style.id = "tex-linebreak-uncopiable-text";
      style.innerHTML =
        "[data-uncopiable-text]::after{content: attr(data-uncopiable-text);}";
      document.head.appendChild(style);
    }
  }
}

export function getHyphenElement(options: TexLinebreakOptions) {
  let hyphen: HTMLElement | Text;
  let hyphenText = "-";
  // if (options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN") {
  //   hyphenText = "";
  // } else
  if (
    options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN_WITH_SOFT_HYPHEN" ||
    options.softHyphenOutput === "SOFT_HYPHEN"
  ) {
    hyphenText = SOFT_HYPHEN;
  }

  if (
    // options.softHyphenOutput === "HTML_UNCOPIABLE_HYPHEN" ||
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
}
