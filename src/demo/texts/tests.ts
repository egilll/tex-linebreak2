import { ListOfDemos } from "src/demo/demo";

export const texts2: ListOfDemos = [
  {
    id: "tmp3",
    content: `
              Text with <span style="display: inline-block; padding:0 8px; border: 2px solid gray"> padding </span> and
              text with <span style="margin: 0 6px; padding:0 1px; border: 1px solid gray">margin</span>.
              <br/>
              <br/>
              <span style="display: inline; border: 5px solid gray">This box</span> has no padding or margins.
              
          
`,
    options: {
      addInfiniteGlueToFinalLine: false,
      hangingPunctuation: false,
    },
  },
  {
    id: "tmp2",
    content: `“Some <a href="#">simple text <i>with</i></a> <code>inline</code> and
              <span style="display: inline-block; border: 1px solid gray"> inline block </span>
              el&shy;em&shy;ents can be found in this paragraph
              <!-- A comment node -->
              of text <a href="#">which includes</a> <b>bold text</b>, 
              as well as <i>italic text</i>. 
              The spaces of <span style="display: inline-block; border: 1px solid gray">inline block elements</span> should also expand.
              <br/>
              <br/>  
              <span style="display: inline-block; border: 1px solid gray"> “A test  <!-- --> </span> whether 
              <span style="display: inline; border: 1px solid gray"> (inline) </span> and <br/> 
              <span style="display: inline; border: 1px solid gray">  inline <i>block!</i></span><br/> elements have correct 
              <span style="display: inline; border: 1px solid gray"> hanging punctuation? </span>
              <br/>
              <br/>
              Text with <span style="display: inline-block; padding:0 8px; border: 2px solid gray"> padding </span> and
              text with <span style="margin: 0 6px; padding:0 1px; border: 1px solid gray">margin</span>.
              <br/>
              <br/>
              <span style="display: inline; border: 5px solid gray">This box</span> has no padding or margins.
              
`,
    options: {
      addInfiniteGlueToFinalLine: false,
      hangingPunctuation: false,
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
        <div style="position:absolute;right:0;border:1px solid red;font-size:smaller;">This element is <br/>absolutely position.</div>
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
    selector: "p",
    content: `
    <div class="gutenberg">
    <div class="chapter">
    
      <p class="letter">
          &lsquo;Do We Progress?&rsquo;
          (<i>Journal of Psychology</i>, March, 1883)
      </p>
      </div>
      </div>
    
    `,
  },
];
