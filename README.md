# tex-linebreak

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) ![npm version](https://img.shields.io/npm/v/tex-linebreak.svg)

_tex-linebreak_ is a JavaScript library for laying out justified text as you
would find in a newspaper, book or technical paper. It implements the
Knuth-Plass line-breaking algorithm,[^1] as used by [TeX](https://en.wikipedia.org/wiki/TeX).

It contains various functions to layout ...

**See the examples**

## Table of contents

* Introduction

* 

## WIP

Monospace







## Introduction

Most text on the web is presented with "ragged-right" margins, as opposed to
the justified text you would find in e.g. a scientific paper or newspaper.
Text can be justified in web pages using `text-align: justify`.
However this option alone tends to result in large&nbsp;&nbsp;&nbsp;spaces
&nbsp;&nbsp;&nbsp;between words which is distracting to read. This is due to the
use of "first fit" line-breaking algorithms where the browser considers only the
current line when finding the next breakpoint. Some browsers support hyphenation
via `hyphens: auto` which reduces this effect. However the first-fit approach
can still produce wide lines and it can also produce more hyphenated lines than
necessary.

The Knuth-Plass algorithm on the other hand optimizes the spacing between words
over the whole paragraph, seeking to minimize the overall "badness" of the
layout. This factor depends on the amount by which spaces have been shrunk or
stretched and the number of hyphenated lines. The benefits of this approach are
greater when rendering narrower columns of text (eg. on small screens).

This table compares the same text rendered in the same environment (font, font
size, device width, margins) using CSS justification, CSS justification +
hyphenation and this library:

<table>
  <tr>
    <td>Safari: text-align: justify</td>
    <td>Chrome: text-align: justify; hyphens: auto</td>
    <td>_tex-linebreak_</td>
  </tr>
  <tr>
    <td><img width="200" src="images/bigint-safari-justify.png"></td>
    <td><img width="200" src="images/bigint-chrome-justify-hyphens.png"></td>
    <td><img width="200" src="images/bigint-tex-linebreak.png"></td>
  </tr>
  <tr>
    <td>CSS justification produces large spaces on the second and penultimate
        lines.</td>
    <td>Enabling hyphenation using `hyphens: auto` in browsers that support it
        (as of 2018-04-07 this appears to be only Chrome) produces better
        output but still produces wide lines.</td>
    <td>The TeX algorithm in contrast hyphenates fewer lines and avoids
        excessive spacing between words.</td>
  </tr>
</table>

_tex-linebreak_ has no dependencies on a particular JS environment (browser,
Node) or render target (`<canvas>`, HTML elements, PDF).

## Try it out

The easiest way to see what the library can do is to [install the bookmarklet](
src/demos/bookmarklet.js) and activate it on an existing web page, such as this
[Medium article](https://medium.com/@parismarx/ubers-unrealistic-plan-for-flying-cars-6c9569d6fa8b).

It will justify and apply hyphenation to the content of any paragraph (`<p>`)
elements on the page. The difference is more beneficial on smaller screens,
so try it in your browser's responsive design mode.

Note that the bookmarklet does not work on sites that use
[Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
to restrict where scripts can be loaded from.

## Usage

First, add the _tex-linebreak_ package to your dependencies:

```sh
npm install tex-linebreak
```

The library has low-level APIs which implement the core line-breaking and
positioning algorithm, as well as higher-level APIs that provide a convenient
way to justify existing HTML content.

### Low-level APIs

The low-level APIs `breakLines` and `positionItems` work with generic "box"
(typeset material), "glue" (spaces with flexible sizing) and "penalty" items.
Typically "boxes" are words, "glue" items are spaces and "penalty" items
represent hyphenation points or the end of a paragraph. However you can use them
to lay out arbitrary content.

```js
import { layoutItemsFromString, breakLines, positionItems } from 'tex-linebreak';

// Convert your text to a set of "box", "glue" and "penalty" items used by the
// line-breaking process.
//
// "Box" items are things (typically words) to typeset.
// "Glue" items are spaces that can stretch or shrink or be a breakpoint.
// "Penalty" items are possible breakpoints (hyphens, end of a paragraph etc.).
//
// `layoutItemsFromString` is a helper that takes a string and a function to
// measure the width of a piece of that string and returns a suitable set of
// items.
const measureText = text => text.length * 5;
const items = layoutItemsFromString(yourText, measureText);

// Find where to insert line-breaks in order to optimally lay out the text.
const lineWidth = 200;
const breakpoints = breakLines(items, lineWidth)

// Compute the (xOffset, line number) at which to draw each box item.
const positionedItems = positionItems(items, lineWidth, breakpoints);

positionedItems.forEach(pi => {
  const item = items[pi.item];

  // Add code to draw `item.text` at `(box.xOffset, box.line)` to whatever output
  // you want, eg. `<canvas>`, HTML elements with spacing created using CSS,
  // WebGL, ...
});
```

### High-level APIs

The high-level APIs provide convenience methods for justifying content in
existing HTML elements and laying out justified lines for rendering to HTML,
canvas or other outputs. This includes support for hyphenation using the
[hypher](https://github.com/bramstein/hypher) library.

#### Justifying existing HTML content

The contents of an existing HTML element can be justified using the
`justifyContent` function.

```js
import enUsPatterns from 'hyphenation.en-us';
import { createHyphenator, justifyContent } from 'tex-linebreak';

const hyphenate = createHyphenator(enUsPatterns);
const paragraphs = Array.from(document.querySelectorAll('p'));
justifyContent(paragraphs, hyphenate);
```

After an element is justified, its layout will remain fixed until `justifyContent`
is called again. In order to re-justify content in response to window size
changes or other events, your code will need to listen for the appropriate
events and re-invoke `justifyContent`.

#### Rendering text

For rendering justified text into a variety of targets (HTML, canvas, SVG,
WebGL etc.), the `layoutText` helper can be used to lay out justifed text and
obtain the positions which each word should be drawn at.

```js
import { createHyphenator, layoutText } from 'tex-linebreak';

import enUsPatterns from 'hyphenation.en-us';

const hyphenate = createHyphenator(enUsPatterns);
const measure = word => word.length * 5;

const { items, positions } = layoutText(text, lineWidth, measure, hyphenate);

positions.forEach(pos => {
  // Draw text as in the above example for the low-level APIs
});
```

## API reference

The source files in [src/](src/) have documentation in the form of TypeScript
annotations.

## Examples

For working code showing different ways to use this library, see [the
demos](src/demos/). You can build and run the demos using:

```
npm i -g http-server

git clone https://github.com/robertknight/tex-linebreak.git
cd tex-linebreak
yarn
yarn build-dev
http-server -c-1
```

Then navigate to http://127.0.0.1:8080/src/demos/layout.html (note that
http-server may choose a different port).

## Caveats

The library currently has a number of caveats:

- It is [not aware of floated content](https://github.com/robertknight/tex-linebreak/issues/1)
  which can affect the available space in a paragraph to lay out text into.
  In the presence of floats lines can exceed the width of the paragraph.
- Justification of existing HTML content relies on modifying the DOM to insert
  linebreaks and wrap text nodes in order to adjust inter-word spacing on each
  line. This can be in slow in large documents. Test it on your content to
  decide whether the overhead is acceptable for your use case. Also limit the
  number of elements which you apply justification to.

## References

[^1]: D. E. Knuth and M. F. Plass, “[Breaking paragraphs into lines](http://www.eprg.org/G53DOC/pdfs/knuth-plass-breaking.pdf)” (PDF), ''Software: Practice and Experience'', vol. 11, no. 11, pp. 1119–1184, Nov. 1981.
