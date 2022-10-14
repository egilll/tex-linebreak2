import { ListOfDemos } from "src/demo/demo";

export const texts2: ListOfDemos = [
  {
    id: "centered",
    content: `
      <p class="center">
      <b>Centered text:</b> Octo men&shy;si&shy;um in præ&shy;dio acta vita fac&shy;ul&shy;tates meas perquam ex&shy;acuit. Bina in die cum ovibus itin&shy;era in pas&shy;cu&shy;um, fre&shy;quens col&shy;li&shy;um per hye&shy;mem cum trahis lig&shy;na&shy;toribus as&shy;cen&shy;sus, sur&shy;sum de&shy;or&shy;sumque in agris deam&shy;bu&shy;la&shy;tio equ&shy;os in&shy;ter aran&shy;dum oc&shy;can&shy;dumque per dies soli&shy;dos se&shy;quen&shy;do, me parem cur&shy;ren&shy;do ef&shy;fe&shy;cerunt, cui cur&shy;sui modo tan&shy;tæ res in&shy;nite&shy;ban&shy;tur, in&shy;terea tamen priusquam.
      </p>
      <p class="right">
      <b>Right-aligned text:</b> Octo men&shy;si&shy;um in præ&shy;dio acta vita fac&shy;ul&shy;tates meas perquam ex&shy;acuit. Bina in die cum ovibus itin&shy;era in pas&shy;cu&shy;um, fre&shy;quens col&shy;li&shy;um per hye&shy;mem cum trahis lig&shy;na&shy;toribus as&shy;cen&shy;sus, sur&shy;sum de&shy;or&shy;sumque in agris deam&shy;bu&shy;la&shy;tio equ&shy;os in&shy;ter aran&shy;dum oc&shy;can&shy;dumque per dies soli&shy;dos se&shy;quen&shy;do, me parem cur&shy;ren&shy;do ef&shy;fe&shy;cerunt, cui cur&shy;sui modo tan&shy;tæ res in&shy;nite&shy;ban&shy;tur, in&shy;terea tamen priusquam.
      </p>
    `,
    options: {
      justify: false,
      infiniteGlueStretchAsRatioOfWidth: 0.02,
    },
    selector: "p",
  },
  {
    id: "tmp2",
    description: "<h2>Various tests</h2>",
    content: `“Some <a href="#">simple text <i>with</i></a> <code>inline</code> and
              <span style="display: inline-block; border: 1px solid gray"> inline block </span>
              el&shy;em&shy;ents can be found in this paragraph
              <!-- A comment node -->
              of text <a href="#">which includes</a> <b>bold text</b>, 
              as well as <i>italic text</i>. 
              The spaces of <span style="display: inline-block; border: 1px solid gray">inline block elements</span> should also expand.
            
              <br/>
              <br/>
              <span style="display: inline; border: 5px solid gray">This box</span> has no padding or margins. 
              <br/>
              <br/>
              <b>(Inline-</b><i>elements!</i><b>)</b> that do not have a <i>background,</i> or a border have hanging punctuation.
              
`,
    options: {
      addInfiniteGlueToFinalLine: false,
      // hangingPunctuation: false,
    },
  },
  {
    id: "tmp3",
    content: `<b>(Inline-</b><i>elements!</i><b>)</b> that do not have a <i>background,</i> or a border have hanging punctuation.
                  
    `,

    options: {
      addInfiniteGlueToFinalLine: false,
    },
  },
  {
    id: "tmp",
    content: `
      <span>
        This 
        <div style="display:none">not displayed</div>
      </span>
      <span> 
        text
        <div style="position:absolute;right:0;border:1px solid red;font-size:smaller;">This element has an <br/>absolute position.</div>
      </span>
      incl<div style="display:none">not displayed</div>udes "display:none" and "position:absolute" elements, which should not interfere with the justification.
      `,
    options: {
      addInfiniteGlueToFinalLine: false,
      hyphenateFn: undefined,
    },
  },
  {
    id: "tmp3",
    content: `
Bla bla bla bla bla bla. Bla bla bla bla bla bla.
          Before the
          <i>comma character</i>, there should be no break.
    
    `,
  },
];
