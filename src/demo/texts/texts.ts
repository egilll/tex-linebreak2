import { ListOfDemos } from "src/demo/demo";

export const texts2: ListOfDemos = [
  {
    id: "tmp",
    content: `
      <span>
        Text
        <div style="display:none">not displayed</div>
      </span>
      <span> 
        that
        <div style="position:absolute;right:0;border:1px solid red;">absolute</div>
      </span>
      shou<div style="display:none">not displayed</div>ld handle display:none elements.
      `,
    options: {
      addInfiniteGlueToFinalLine: false,
      hyphenateFn: undefined,
    },
  },
  {
    id: "tmp2",
    content: `“Some <a href="#">simple text <i>with</i></a> embedded <code>inline</code> and
              <span style="display: inline-block; border: 1px solid gray">inline-block</span>
              el&shy;em&shy;ents can be found in this paragraph
              <!-- A comment node -->
              of text which includes <b>bold text</b>, as well as <i>italic text</i>.`,
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
