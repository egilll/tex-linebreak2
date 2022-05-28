import { splitTextIntoItems } from 'src/helpers/splitTextIntoItems/splitTextIntoItems';

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
//   }).getPlainText(),
// );

console.log(
  splitTextIntoItems(
    'export j',
    {
      addParagraphEnd: false,
      measureFn: (text: string) => {
        return text.length;
      },
    },
    '',
    '',
  ),
);
