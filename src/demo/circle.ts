import { ListOfDemos } from "src/demo/demo";
import { optimizeByFnCircle } from "src/optimize/optimizeByFnCircle";

// const text = texts[0];

// const outputElement = document.getElementById("demo-output")! as HTMLElement;
// outputElement.innerHTML = text;
// // outputElement.style.textAlign = "center";
// outputElement.style.fontStyle = "italic";

// const lineHeight = parseInt(window.getComputedStyle(outputElement).lineHeight);

// const run = () => {
//   try {
//     texLinebreakDOM(
//       outputElement,
//       {
//         optimizeByFn,
//         lineHeight,
//         hyphenateFn,
//         addInfiniteGlueToFinalLine: false,
//         setElementWidthToMaxLineWidth: true,
//       }
//       // true
//     );
//   } catch (e) {
//     console.error(e);
//     outputElement.insertAdjacentHTML(
//       "beforebegin",
//       `<div class="error">Error: Tex-linebreak encountered an error when breaking this paragraph.</div>`
//     );
//   }
// };
// run();

export const circle: ListOfDemos[number] = {
  id: "circle",
  selector: "p",
  className: "",
  content: `<p style="font-style: italic;font-size: 13px;line-height:15px;margin:auto;">Octo men&shy;si&shy;um in præ&shy;dio acta vita fac&shy;ul&shy;tates meas perquam ex&shy;acuit. Bina in die cum ovibus itin&shy;era in pas&shy;cu&shy;um, fre&shy;quens col&shy;li&shy;um per hye&shy;mem cum trahis lig&shy;na&shy;toribus as&shy;cen&shy;sus, sur&shy;sum de&shy;or&shy;sumque in agris deam&shy;bu&shy;la&shy;tio equ&shy;os in&shy;ter aran&shy;dum oc&shy;can&shy;dumque per dies soli&shy;dos se&shy;quen&shy;do, me parem cur&shy;ren&shy;do ef&shy;fe&shy;cerunt, cui cur&shy;sui modo tan&shy;tæ res in&shy;nite&shy;ban&shy;tur, in&shy;terea tamen priusquam In&shy;dum con&shy;venis&shy;sem, iam la&shy;boris unius diei æqu&shy;um præsti&shy;ti: cal&shy;ceos paludes per&shy;vaden&shy;do made&shy;fe&shy;ci, Rivu&shy;lum Ash&shy;ford atque Flu&shy;vi&shy;um Viri&shy;dem ped&shy;ibus per&shy;tran&shy;sivi, et pedes mei modo iam pus&shy;tulis hor&shy;rere cœpe&shy;runt. Si modo equ&shy;um in&shy;venirem, cog&shy;itabam mecum, siquis ob&shy;vi&shy;am fieret qui mihi adi&shy;u&shy;men&shy;to esse pos&shy;set, for&shy;t&shy;asse nec&shy;dum sero qui&shy;dem venirem, verum ego ne sub&shy;sis&shy;tere qui&shy;dem ad opem flag&shy;i&shy;tan&shy;dam ausus sum et quum denique Williamstown at&shy;tig&shy;er&shy;am re&shy;spon&shy;sum mihi est copias iam ante ho&shy;ram ab&shy;sces&shy;sisse.</p>`,

  // content: `<!--<p style="font-style: italic;font-size: 13px;line-height:15px;margin:auto;">“One of the most im&shy;por&shy;tant op&shy;er&shy;a&shy;tions nec&shy;es&shy;sary when text ma&shy;te&shy;ri&shy;als are pre&shy;pared for print&shy;ing or dis&shy;play is the task of di&shy;vid&shy;ing long para&shy;graphs into in&shy;di&shy;vid&shy;ual lines. When this job has been done well, peo&shy;ple will not be aware of the fact that the words they are read&shy;ing have been ar&shy;bi&shy;trar&shy;i&shy;ly bro&shy;ken apart and placed into a some&shy;what rigid and un&shy;nat&shy;ur&shy;al rec&shy;tan&shy;gu&shy;lar frame&shy;work; but if the job has been done poor&shy;ly, read&shy;ers will be dis&shy;tract&shy;ed by bad breaks that in&shy;ter&shy;rupt their train of thought.”--></p>`,

  options: {
    optimizeByFn: optimizeByFnCircle,
    lineHeight: 15,
    // hyphenateFn,
    addInfiniteGlueToFinalLine: false,
    setElementWidthToMaxLineWidth: true,
  },
};

// outputElement.addEventListener("input", debounce(run, 40));
