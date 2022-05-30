import { texLinebreakMonospace } from 'src/helpers/monospace';

it('onlyBreakOnWhitespace', () => {
  expect(
    texLinebreakMonospace('Ilex-grandis-arbor-est-patula-quanta Pyrus.', {
      onlyBreakOnWhitespace: true,
      forceOverflowToBreak: false,
      lineWidth: 20,
    }).plainTextLines,
  ).toEqual(['Ilex-grandis-arbor-est-patula-quanta', 'Pyrus.']);
});
// console.log(
//   texLinebreakMonospace('Ilex-grandis-arbor-est-patula-quanta Pyrus.', {
//     onlyBreakOnWhitespace: true,
//     forceOverflowToBreak: false,
//     lineWidth: 20,
//   }).plainTextLines,
// );
