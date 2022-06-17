import { assert } from "chai";
import { texLinebreakDOM } from "src/html/texLinebreakDOM";

function extractLines(el: HTMLElement) {
  const tmpEl = document.createElement("span");
  tmpEl.innerHTML = el.innerHTML.replace(/<br>/g, "--");
  return tmpEl.textContent!.split("--").map((s) => s.trim());
}

function stripSpacing(el: HTMLElement) {
  const spans = Array.from(el.querySelectorAll("span"));
  spans.forEach((s) => (s.style.wordSpacing = ""));
}

function trimLineSpans(spans: HTMLElement[]) {
  spans.forEach((span) => {
    const text = span.childNodes[0];
    text.nodeValue = text.nodeValue!.trim();
  });
}

describe("html", () => {
  describe("texLinebreakDOM", () => {
    let paragraph: HTMLParagraphElement;
    let cleanupEls: HTMLElement[];

    function createParagraph(html: string) {
      const para = document.createElement("p");
      para.innerHTML = html;
      para.style.width = "100px";
      document.body.appendChild(para);
      cleanupEls.push(para);
      return para;
    }

    beforeEach(() => {
      cleanupEls = [];
      paragraph = createParagraph(
        "This is some test content that should be wrapped"
      );
    });

    afterEach(() => {
      cleanupEls.forEach((el) => el.remove());
    });

    it("adds line breaks to existing text", () => {
      texLinebreakDOM(paragraph);

      const lines = extractLines(paragraph);
      assert.deepEqual(lines, [
        "This is some",
        "test content",
        "that should be",
        "wrapped",
      ]);
      // assert.deepEqual(lines, [
      //   "This is some",
      //   "test content",
      //   "that should be",
      //   "wrapped",
      // ]);
      // expect(lines.length).toBe(4);
    });

    // it("uses word-spacing to adjust lines to fill available space", () => {
    //   texLinebreakDOM(para);
    //   const spans = Array.from(para.querySelectorAll("span"));
    //
    //   // Strip trailing space from each line which is not visible and not
    //   // accounted for when justifying the text, but does count towards the
    //   // width reported by `getBoundingClientRect`.
    //   trimLineSpans(spans);
    //   const lineWidths = spans.map((s) => s.getBoundingClientRect().width);
    //
    //   // Check that every line is the expected width.
    //   const expectedWidth = parseInt(getComputedStyle(para).width!);
    //   assert.deepEqual(
    //     lineWidths,
    //     lineWidths.map(() => expectedWidth)
    //   );
    //
    //   // Check that this has been achieved by adjusting `word-spacing`.
    //   spans.forEach((span) => {
    //     const extraSpacing = parseInt(span.style.wordSpacing!);
    //     assert.notEqual(extraSpacing, 0);
    //   });
    // });

    it("disables the browser's own line wrapping", () => {
      texLinebreakDOM(paragraph);
      assert.equal(paragraph.style.whiteSpace, "nowrap");
    });

    it("can re-justify already-justified content", () => {
      texLinebreakDOM(paragraph);
      const firstResult = paragraph.innerHTML;
      texLinebreakDOM(paragraph);
      const secondResult = paragraph.innerHTML;

      assert.equal(firstResult, secondResult);
    });

    // it("removes existing hyphens that are no longer needed when re-justifying text", () => {
    //   const text = "Content with longwords thatdefinitely needshyphenation";
    //   paragraph.textContent = text;
    //
    //   texLinebreakDOM(paragraph, { hyphenateFn });
    //   assert.notEqual(paragraph.textContent, text, "did not insert hyphens");
    //
    //   paragraph.style.width = "400px";
    //   texLinebreakDOM(paragraph, { hyphenateFn });
    //   assert.equal(paragraph.textContent, text, "did not remove hyphens");
    // });

    it("uses correct line width if `box-sizing` is `border-box`", () => {
      paragraph.style.boxSizing = "border-box";
      paragraph.style.paddingLeft = "15px";
      paragraph.style.paddingRight = "15px";

      texLinebreakDOM(paragraph);

      const lines = extractLines(paragraph);
      assert.deepEqual(lines, [
        "This is",
        "some test",
        "content",
        "that",
        "should be",
        "wrapped",
      ]);
    });

    it("accounts for font style", () => {
      paragraph.style.fontSize = "9px";

      texLinebreakDOM(paragraph);

      const lines = extractLines(paragraph);
      assert.deepEqual(lines, [
        "This is some test content",
        "that should be wrapped",
      ]);
    });

    // it("does not break lines or adjust spacing inside `inline-block` boxes", () => {
    //   const blockContent = "This is a lengthy line which should not be wrapped";
    //   para.innerHTML = `foo
    //   <span class="block" style="display: inline-block">${blockContent}</span>
    //   bar`;
    //   const initialHtml = para.innerHTML;
    //
    //   texLinebreakDOM(para);
    //
    //   const blockBox = para.querySelector(".block")!;
    //   assert.equal(blockBox.innerHTML.trim(), blockContent);
    // });

    // [
    //   "marginLeft",
    //   "borderLeftWidth",
    //   "paddingLeft",
    //   "paddingRight",
    //   "borderRightWidth",
    //   "marginRight",
    // ].forEach((property) => {
    //   it(`accounts for '${property}' property on inline children`, () => {
    //     paragraph.innerHTML =
    //       "test with <b>inline child</b> and some other text";
    //     texLinebreakDOM(paragraph);
    //     const linesBefore = extractLines(paragraph);
    //
    //     const inlineEl = paragraph.querySelector("b")!;
    //     inlineEl.style[property as any] = "10px";
    //     if (property.startsWith("border")) {
    //       inlineEl.style.borderStyle = "solid";
    //     }
    //     texLinebreakDOM(paragraph);
    //     const linesAfter = extractLines(paragraph);
    //
    //     // Check that the line breaking changes before and after adding a
    //     // margin/border/padding to the inline element.
    //     //
    //     // Ideally we should check whether the _visible content_ is the same
    //     // width on each line. That is a bit fiddly at present because some
    //     // lines may actually be longer but end with invisible whitespace.
    //     assert.notDeepEqual(linesBefore, linesAfter);
    //   });
    // });

    it("justifies multiple paragraphs", () => {
      const text = "test that multiple paragraphs are justified";
      const p1 = createParagraph(text);
      const p2 = createParagraph(text);

      texLinebreakDOM([p1, p2]);

      const lines1 = extractLines(p1);
      const lines2 = extractLines(p2);
      assert.deepEqual(lines1, [
        "test that",
        "multiple",
        "paragraphs are",
        "justified",
      ]);
      assert.deepEqual(lines1, lines2);
    });
  });
});
