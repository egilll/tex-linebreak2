import { hyphenateHTMLSync } from "hyphen/en";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";

console.log(
  splitTextIntoItems("\n", {
    measureFn: (word) => word.length,
    lineWidth: 100,
  })
);

console.log(
  hyphenateHTMLSync(
    `One of the most important operations necessary when text materials are prepared for printing or display is the task of dividing long paragraphs into individual lines. When this job has been done well, people will not be aware of the fact that the words they are reading have been arbitrarily broken apart and placed into a somewhat rigid and unnatural rectangular framework; but if the job has been done poorly, readers will be distracted by bad breaks that interrupt their train of thought. `
  )
);
