- The `nowrap` which is applied to the paragraph should not apply to sub-elements such as floated nested content.
- Test nested inline-block elemenents.
- Wait until `DOMContentLoaded` to check again whether things have changed (e.g. fonts loaded)
- Tthere is something wrong with `<br/>`, the output is different depending on actual paragraph breaks vs `<br/>` breaks. Should perhaps be separated.
- last glue in ragged text should be of the same stretchiness
- `<wbr/>` not supported
- Test if works with very very long paragraphs.
- `forciblySplitLongWords` is broken in DOM
- Test on actual webpages.
- Bookmarklet
- Cache

Other:

* `isExtraneousLine`

---

For the future:

- Find optimal width
- Indentation: "If the paragraph is to be indented, the first item x, will be an empty box whose width is the amount of indentation."
- Ability to prefer certain soft hyphens over others (i.e. word-level breaks over syllable breaks)
- Urls should break on slashes rather than dashes
- To consider: Automatically apply justification to paragraphs while applying centering to `<h1/>` elements?
