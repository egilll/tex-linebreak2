import { ListOfDemos } from "src/demo/demo";
import { optimizeByFnCircle } from "src/optimize/optimizeByFnCircle";

export const circle: ListOfDemos[number] = {
  id: "circle",
  selector: "p",
  className: "",
  content: `<p style="font-style: italic;font-size: 13px;line-height:15px;margin:auto;">Octo men&shy;si&shy;um in præ&shy;dio acta vita fac&shy;ul&shy;tates meas perquam ex&shy;acuit. Bina in die cum ovibus itin&shy;era in pas&shy;cu&shy;um, fre&shy;quens col&shy;li&shy;um per hye&shy;mem cum trahis lig&shy;na&shy;toribus as&shy;cen&shy;sus, sur&shy;sum de&shy;or&shy;sumque in agris deam&shy;bu&shy;la&shy;tio equ&shy;os in&shy;ter aran&shy;dum oc&shy;can&shy;dumque per dies soli&shy;dos se&shy;quen&shy;do, me parem cur&shy;ren&shy;do ef&shy;fe&shy;cerunt, cui cur&shy;sui modo tan&shy;tæ res in&shy;nite&shy;ban&shy;tur, in&shy;terea tamen priusquam In&shy;dum con&shy;venis&shy;sem, iam la&shy;boris unius diei æqu&shy;um præsti&shy;ti: cal&shy;ceos paludes per&shy;vaden&shy;do made&shy;fe&shy;ci, Rivu&shy;lum Ash&shy;ford atque Flu&shy;vi&shy;um Viri&shy;dem ped&shy;ibus per&shy;tran&shy;sivi, et pedes mei modo iam pus&shy;tulis hor&shy;rere cœpe&shy;runt. Si modo equ&shy;um in&shy;venirem, cog&shy;itabam mecum, siquis ob&shy;vi&shy;am fieret qui mihi adi&shy;u&shy;men&shy;to esse pos&shy;set, for&shy;t&shy;asse nec&shy;dum sero qui&shy;dem venirem, verum ego ne sub&shy;sis&shy;tere qui&shy;dem ad opem flag&shy;i&shy;tan&shy;dam ausus sum et quum denique Williamstown at&shy;tig&shy;er&shy;am re&shy;spon&shy;sum mihi est copias iam ante ho&shy;ram ab&shy;sces&shy;sisse.</p>`,

  options: {
    optimizeByFn: optimizeByFnCircle,
    lineHeight: 15,
    // hyphenateFn,
    addInfiniteGlueToFinalLine: false,
    setElementWidthToMaxLineWidth: true,
    // fillAllLines: true,
  },
};
