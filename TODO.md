- inline-block elements
- urls should break on / not on dashes
- break only visible paragraphs
- demo should respect newlines
- hypher very slow since it needs to initialize tries
- inline block elements do not have stretchy glue
- optimal width ætti að prófa nokkrar stærðir
- includeSoftHyphensInOutput
- \penalty 1000

- treat "\ " as a non-breaking space
- include spaces in output

- optimum fit
- vera viss um að webpack exporti öllu

- Since the task of word division is nontrivial, TEX first tries to break a paragraph into lines without any discretionary hyphens
- The second pass would only try to hyphenate uncapitalized words of five or more letters

-If the paragraph is to be indented, the first item x,will be an empty box whose width is the amount of indentation.

- ability to prefer certain soft hyphens over others
- prefer already-existing soft hyphens
- þarf að passa að keyra ekki hyphenation aftur á orðum sem eru nú þegar með soft hyphen?
- inline-block items with margins

- nowrap ætti ekki að gilda um sub-elements!
- performance test
- wait until ondomloaded to check again whether things have changed (e.g. fonts loaded)

- when applied to a top-level div, "no-break" should not apply to it!

- ignore zero-width word-final glue in block elements
- test if works with very very long paragraphs. prevent too many recursive breaklines calls
