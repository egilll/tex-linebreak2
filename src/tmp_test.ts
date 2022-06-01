import { texLinebreakMonospace } from 'src/monospace';

// console.log(
//   new TexLinebreak({
//     // text: 'Nulla ultricies, dolor in sagittis rutrum, nibh purus bibendum dui, nec aliquet ligula mi eget2 lectus. Nulla eget metus scelerisque, venenatis sapien ut, congue eros. Morbi convallis venenatis mauris, laoreet faucibus magna malesuada sed. Nulla consequat dignissim arcu non vestibulum. In commodo tristique scelerisque.',
//     items,
//     lineWidth: 300,
//     // measureFn: (text: string) => {
//     //   return text.length;
//     // },
//     // preset: 'monospace',
//     // hyphenate: false,
//   }).plainText,
// );

// console.log(
//   splitTextIntoItems(
//     'export j',
//     {
//       addParagraphEnd: false,
//       measureFn: (text: string) => {
//         return text.length;
//       },
//     },
//     '',
//     '',
//   ),
// );
//
// const text =
//   'Chamæleon animal est quadrupes, macrum & gibbosum, capite galeato, corpore & cauda lacertæ majoris, cervice penè nulla, costis plus minus sedecim, obliquo ductu ventri junctis ut piscibus.';
// const output = new TexLinebreak(text, {
//   lineWidth: 45,
// }).plainText;

// const output = texLinebreakMonospace('A very_very_very_very_very_long_string here.', {
//   forceOverflowToBreak: true,
//   lineWidth: 20,
// }).plainTextLines;
// console.log(output);

console.log(
  texLinebreakMonospace('Test long string.', {
    forceOverflowToBreak: true,
    lineWidth: 13,
  }).plainTextLines,
);
