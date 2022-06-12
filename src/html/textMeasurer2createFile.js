// node ~/tex-linebreak/src/html/textMeasurer2createFile.js

// @ts-ignore
var TTFFont = require("ttfjs");
var fs = require("fs");

var font = new TTFFont(
  fs.readFileSync("/Library/Fonts/Microsoft/Times New Roman.ttf")
);

/** todo: https://docs.microsoft.com/en-us/typography/opentype/spec/kern */
fs.writeFileSync(
  "./test.json",
  JSON.stringify({
    unitsPerEm: font.tables.head.unitsPerEm,
    hmtxMetrics: font.tables.hmtx.metrics,
    codeMap: font.codeMap,
  })
);
