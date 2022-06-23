- "<i>italic</i>." má ekki hafa penalty 0 á eftir þarna!!!
- inline block mega ekki fá br innan í sig!
- testa þegar það er html commment innan í paragraph
- should actually break on good penalties, if every letter has a 999 penalty after it it should never break on [ 'Test long s', 'tring.' ]
- test that penalty before a glue is respected
- should break even when lineWidth is 0
- hanging punctuation should not overlap with next item!
- "bla bla\n bla bla" – How to handle indentation
- "d\n\nd" - insert some glue in the double newline

```
Used by {@link oldCards} when classifying
which already-seen cards should be chosen.
```

Handle:

{ type: 'penalty', width: 0, cost: -10000000, flagged: false },
{ type: 'glue', width: 0, shrink: 0, stretch: 100000 },
{ type: 'penalty', width: 0, cost: -10000000, flagged: false }
