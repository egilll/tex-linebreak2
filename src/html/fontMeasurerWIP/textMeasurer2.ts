// import TimesNewRoman from "src/test.json";
//
// export function measureTextFromFontFile(string: string, size: number): number {
//   // https://github.com/rkusa/ttfjs, MIT
//   let width = 0;
//   const scale = size / TimesNewRoman.unitsPerEm;
//   for (let i = 0, len = string.length; i < len; ++i) {
//     var code = string.charCodeAt(i);
//
//     if (code < 32) continue;
//
//     width +=
//       TimesNewRoman.hmtxMetrics[
//         // @ts-ignore
//         TimesNewRoman.codeMap[code].toString()
//       ]; /*|| this.avgCharWidth */
//   }
//
//   return width * scale;
// }
