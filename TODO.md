- inline-block elements
- urls should break on / not on dashes
- break only visible paragraphs
- demo should respect newlines
- hypher very slow since it needs to initialize tries
- inline block elements do not have stretchy glue
- optimal width ætti að prófa nokkrar stærðir
- includeSoftHyphensInOutput
- \penalty 1000

- Incidentally, our line-breaking criteria have been developed with justified text in mind; but the algorithm has been used in Figure 6 to produce ragged right margins. Another criterion of badness, which is based solely on the difference between the desired length 4 and the actual length Lj, should actually be used in order to get the best breakpoints for ragged-right typesetting, and the space between words should be allowed to stretch but not to shrink so that Lj never exceeds 4. Furthermore, ragged-right typesetting should not allow words to ‘stick out’, i.e., to begin to the right of where the following line ends (see the word ‘it’ in Figure 5). Thus, it turns out that an algorithm intended for high quality line breaking in ragged-right formats is actually a little bit harder to write than one for justified text, contrary to the prevailing opinion that justification is more difficult. On the other hand, Figure 6
  indicates that an algorithm designed for justification usually can be tuned to produce adequate breakpoints when justification is suppressed.

  - sjá umræðu á bls 1139 (#page=21)

- It is quite easy to get the line- breaking algorithm to avoid certain breaks by simply prefixing the glue item by a penalty with pi = 999, say; then the bad break is chosen only in an emergency, when there is no other good way to set the paragraph.
- treat "\ " as a non-breaking space
- include spaces in output
- interface Point extends PartialPointX { y: number; }

- optimum fit
- vera viss um að webpack exporti öllu

- Under certain circumstances we can also combine two adjacent penalty items into a
  single one; for example, if - 00 < p, p’< +Infinity we have
  penalty(w,p,f) penalty(w,p’,f) = penalty(w, min(p,p’),f)
- Furthermore we can delete any penalty item with p = if it is not immediately preceded by a box item.

- Since the task of word division is nontrivial, TEX first tries to break a paragraph into lines without any discretionary hyphens
- The second pass would only try to hyphenate uncapitalized words of five or more letters

-If the paragraph is to be indented, the first item x,will be an empty box whose width is the amount of indentation.

- fyrir framan langt orð ætti að vera auka bil

- ability to prefer certain soft hyphens over others
- glue ætti að vera annaðhvort merkt sem „visible” eða „invisible”
- prefer already-existing soft hyphens
- þarf að passa að keyra ekki hyphenation aftur á orðum sem eru nú þegar með soft hyphen?
