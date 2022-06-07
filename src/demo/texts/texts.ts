import { TexLinebreakOptions } from "src/options";

export const texts2: Record<
  string,
  { html: string; options: Partial<TexLinebreakOptions> }
> = {
  tmp: {
    html: `
    
    <span>
      Text
      <div style="display:none">not displayed</div>
    </span>
      hehehe d dsd 
      `,
    // html: `
    //   <span>
    //     Text
    //     <div style="display:none">not displayed</div>
    //   </span>
    //   <span>
    //     that
    //     <div style="position:absolute;right:0;border:1px solid red;">absolute</div>
    //   </span>
    //   shou<div style="display:none">not displayed</div>ld handle display:none elements.
    //   `,
    options: {
      addInfiniteGlueToFinalLine: false,
    },
  },
};
export const texts = [
  "“Octo mensium in prædio acta vita facultates meas perquam exacuit. Bina in die cum ovibus itinera in pascuum, frequens collium per hyemem cum trahis lignatoribus ascensus, sursum deorsumque in agris deambulatio equos inter arandum occandumque per dies solidos sequendo, me parem currendo effecerunt, cui cursui modo tantæ res innitebantur, interea tamen priusquam Indum convenissem, iam laboris unius diei æquum præstiti: calceos paludes pervadendo madefeci, Rivulum Ashford atque Fluvium Viridem pedibus pertransivi, et pedes mei modo iam pustulis horrere cœperunt. Si modo equum invenirem, cogitabam mecum, siquis obviam fieret qui mihi adiumento esse posset, fortasse necdum sero quidem venirem, verum ego ne subsistere quidem ad opem flagitandam ausus sum et quum denique Williamstown attigeram responsum mihi est copias iam ante horam abscessisse.",
  `“Some <a href="#">simple text <i>with</i></a> embedded <code>inline</code> and
          <span style="display: inline-block; border: 1px solid gray">inline-block</span>
          el&shy;em&shy;ents can be found in this paragraph
          <!-- A comment node -->
          of text which includes <b>bold text</b>, as well as <i>italic text</i>.`,
  `“When the first paper volume of Donald Knuth's The Art of Computer Programming was published in 1968, it was typeset using hot metal typesetting set by a Monotype Corporation typecaster. This method, dating back to the 19th century, produced a "good classic style" appreciated by Knuth. When the second edition of the second volume was published, in 1976, the whole book had to be typeset again because the Monotype technology had been largely replaced by phototypesetting, and the original fonts were no longer available.`,
];
