import { ListOfDemos } from "src/demo/demo";
import { optimizeByFn } from "src/optimize/optimizeByFn";
import { hyphenateFn } from "test/utils/enHyphenateFn";

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
  content:
    "Octo mensium in prædio acta vita facultates meas perquam exacuit. Bina in die cum ovibus itinera in pascuum, frequens collium per hyemem cum trahis lignatoribus ascensus, sursum deorsumque in agris deambulatio equos inter arandum occandumque per dies solidos sequendo, me parem currendo effecerunt, cui cursui modo tantæ res innitebantur, interea tamen priusquam Indum convenissem, iam laboris unius diei æquum præstiti: calceos paludes pervadendo madefeci, Rivulum Ashford atque Fluvium Viridem pedibus pertransivi, et pedes mei modo iam pustulis horrere cœperunt. Si modo equum invenirem, cogitabam mecum, siquis obviam fieret qui mihi adiumento esse posset, fortasse necdum sero quidem venirem, verum ego ne subsistere quidem ad opem flagitandam ausus sum et quum denique Williamstown attigeram responsum mihi est copias iam ante horam abscessisse.",
  style: {
    margin: "0 auto",
    fontStyle: "italic",
  },
  options: {
    optimizeByFn,
    // lineHeight,
    hyphenateFn,
    addInfiniteGlueToFinalLine: false,
    setElementWidthToMaxLineWidth: true,
  },
};

// outputElement.addEventListener("input", debounce(run, 40));
