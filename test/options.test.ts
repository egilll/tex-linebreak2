import { texLinebreakMonospace } from 'src/utils/monospace';

it('onlyBreakOnWhitespace', () => {
  expect(
    texLinebreakMonospace('Ilex-grandis-arbor-est-patula-quanta Pyrus.', {
      onlyBreakOnWhitespace: true,
      forceOverflowToBreak: false,
      lineWidth: 20,
    }).plainTextLines,
  ).toEqual(['Ilex-grandis-arbor-est-patula-quanta', 'Pyrus.']);
});

// it('forceOverflowToBreak', () => {
//   // On by default
//   expect(
//     texLinebreakMonospace('A very_very_very_very_very_l here.', {
//       lineWidth: 20,
//     }).plainTextLines,
//   ).toEqual(['A', 'very_very_very_very_very_long_string', 'here.']);
//   expect(
//     texLinebreakMonospace('A very_very_very_very_very_long_string here.', {
//       forceOverflowToBreak: false,
//       lineWidth: 20,
//     }).plainTextLines,
//   ).toEqual(['A', 'very_very_very_very_very_long_string', 'here.']);
// });

// console.log(
//   texLinebreakMonospace('Ilex-grandis-arbor-est-patula-quanta Pyrus.', {
//     onlyBreakOnWhitespace: true,
//     forceOverflowToBreak: false,
//     lineWidth: 20,
//   }).plainTextLines,
// );
