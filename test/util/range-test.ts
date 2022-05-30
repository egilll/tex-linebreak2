import { textNodesInRange } from 'src/helpers/deprecated/textNodesInRange';

function acceptAllNodes() {
  return true;
}

describe('range', () => {
  let para: HTMLParagraphElement;
  beforeEach(() => {
    para = document.createElement('p');
    document.body.appendChild(para);
  });

  afterEach(() => {
    para.remove();
  });

  describe('textNodesInRange', () => {
    it('returns all text nodes in range', () => {
      const texts = [new Text('first'), new Text('second')];

      texts.forEach((t) => para.appendChild(t));
      const range = document.createRange();
      range.selectNode(para);

      expect(textNodesInRange(range, acceptAllNodes)).toEqual(texts);
    });

    it('does not return non-Text nodes', () => {
      para.innerHTML = 'foo <b>bar</b> baz <!-- meep !-->';

      const range = document.createRange();
      range.selectNode(para);
      const texts = textNodesInRange(range, acceptAllNodes);

      texts.forEach((t) => expect(t).toBeInstanceOf(Text));
    });

    it('returns text nodes in a range with only one node', () => {
      para.innerHTML = 'test';

      const range = document.createRange();
      range.setStart(para.childNodes[0], 1);
      range.setEnd(para.childNodes[0], 3);

      expect(textNodesInRange(range, acceptAllNodes)).toEqual([para.childNodes[0]]);
    });

    it('does not return text nodes outside of range', () => {
      const texts = [new Text('one'), new Text('two'), new Text('three')];
      texts.forEach((t) => para.appendChild(t));

      const range = document.createRange();
      range.setStart(para, 1);
      range.setEnd(para, 2);

      expect(textNodesInRange(range, acceptAllNodes)).toEqual([texts[1]]);
    });

    it('skips subtrees which are filtered out', () => {
      const texts = [new Text('first'), new Text('second'), new Text('third')];

      const child = document.createElement('span');
      child.appendChild(texts[1]);

      para.appendChild(texts[0]);
      para.appendChild(child);
      para.appendChild(texts[2]);
      const range = document.createRange();
      range.selectNode(para);

      const rejectSpans = (node: Node) => {
        if (!(node instanceof Element)) {
          return true;
        }
        return node.tagName !== 'SPAN';
      };

      expect(textNodesInRange(range, rejectSpans)).toEqual([texts[0], texts[2]]);
    });
  });
});
