Important:

* The `nowrap` which is applied to the paragraph should not apply to sub-elements such as floated nested content.
* Test nested inline-block elemenents.
* Wait until `DOMContentLoaded` to check again whether things have changed (e.g. fonts loaded)
* Tthere is something wrong with `<br/>`, the output is different depending on actual paragraph breaks vs `<br/>` breaks. Should perhaps be separated.
* last glue in ragged text should be of the same stretchiness
* `<wbr/>` not supported



For the future:

- Indentation: "If the paragraph is to be indented, the first item x,will be an empty box whose width is the amount of indentation."

- Ability to prefer certain soft hyphens over others (i.e. word-level breaks over syllable breaks)

- Urls should break on slashes rather than dashes

- Find optimal width

- 

  

- wait until ondomloaded to check again whether things have changed (e.g. fonts loaded)

- when applied to a top-level div, "no-break" should not apply to it!

- ignore zero-width word-final glue in block elements

- test if works with very very long paragraphs. prevent too many recursive breaklines calls

- can nested inline blocks break?

- `<wbr/>`

- 

- force split doesn't work right
