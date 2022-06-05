import { texLinebreakMonospace } from 'src/utils/monospace';

console.log(
  texLinebreakMonospace('Ilex-grandis-arbor-est-patula-quanta Pyrus.', {
    onlyBreakOnWhitespace: true,
    forceOverflowToBreak: false,
    lineWidth: 20,
  }).plainText,
);
