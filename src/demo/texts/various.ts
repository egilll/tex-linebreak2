import { ListOfDemos } from "src/demo/demo";

const dostoevsky = `<p style="max-width:250px;margin:auto;font-size:14px;">
“Young man,” he went on, rais&shy;ing his head again, “in your face I seem to read some trou&shy;ble of mind. When you came in I read it, and that was why I ad&shy;dressed you at once. For in un&shy;fold&shy;ing to you the sto&shy;ry of my life, I do not wish to make my&shy;self a laughing-stock be&shy;fore these idle lis&shy;ten&shy;ers, who in&shy;deed know all about it al&shy;ready, but I am look&shy;ing for a man of feel&shy;ing and ed&shy;u&shy;ca&shy;tion. Know then that my wife was ed&shy;u&shy;cat&shy;ed in a high-class school for the daugh&shy;ters of no&shy;ble&shy;men, and on leav&shy;ing she danced the shawl dance be&shy;fore the gov&shy;er&shy;nor and oth&shy;er per&shy;son&shy;ages for which she was pre&shy;sent&shy;ed with a gold medal and a cer&shy;tifi&shy;cate of mer&shy;it. The medal... well, the medal of course was sold—long ago, hm... but the cer&shy;tifi&shy;cate of mer&shy;it is in her trunk still and not long ago she showed it to our land&shy;la&shy;dy. And al&shy;though she is most con&shy;tin&shy;u&shy;al&shy;ly on bad terms with the land&shy;la&shy;dy, yet she want&shy;ed to tell some&shy;one or oth&shy;er of her past ho&shy;n&shy;ours and of the hap&shy;py days that are gone. I don’t con&shy;demn her for it, I don’t blame her, for the one thing left her is rec&shy;ol&shy;lec&shy;tion of the past, and all the rest is dust and ash&shy;es.
</p>`;

export const various: ListOfDemos = [
  {
    id: "justify",
    description: "Justified, no space allowed at the end of the paragraph:",

    options: {
      addInfiniteGlueToFinalLine: false,
      softHyphenPenalty: 100,
    },
    selector: "p",
    content: dostoevsky,
  },

  {
    id: "left",
    description: "Left alignment, spaces not allowed to stretch:",
    options: {
      justify: false,
      infiniteGlueStretchAsRatioOfWidth: 0.06,
      glueShrinkFactor: 0,
      glueStretchFactor: 0,
      // softHyphenPenalty: 999,
      initialMaxAdjustmentRatio: 1,
    },
    selector: "p",
    content: dostoevsky,
  },

  {
    id: "left2",
    description: "Left alignment, spaces allowed to stretch:",
    options: {
      justify: false,
      infiniteGlueStretchAsRatioOfWidth: 0.05,
      glueShrinkFactor: 0.3,
      glueStretchFactor: 0.54,
      // softHyphenPenalty: 999,
      initialMaxAdjustmentRatio: 0.3,
    },
    selector: "p",
    content: dostoevsky,
  },
];
