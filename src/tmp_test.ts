import { texLinebreakMonospace } from "src/utils/monospace";

console.log(
  texLinebreakMonospace(
    "April 2017. Held annually, the Boat Race is a side-by-side rowing race between crews from the universities of Oxford and Cambridge along a 4.2-mile (6.8 km) tidal stretch of the River Thames in south-west London. For the second time in the h",
    {
      lineWidth: 20,
      addInfiniteGlueToFinalLine: false,
    }
  ).plainText
);
