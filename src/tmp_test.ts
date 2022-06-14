import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";

console.log(
  splitTextIntoItems("\n", {
    measureFn: (word) => word.length,
    lineWidth: 100,
  })
);
