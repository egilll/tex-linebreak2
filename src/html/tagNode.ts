export const NODE_TAG = "insertedByTexLinebreak";

/** Mark a node as having been created by `texLinebreakDOM`. */
export function tagNode<T extends Node>(node: T): T {
  (node as any)[NODE_TAG] = true;
  return node;
}

/** Return all descendants of `node` created by `texLinebreakDOM`. */
export function getTaggedChildren(node: Node, tag = NODE_TAG): Node[] {
  const children = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (child.hasOwnProperty(tag)) {
      children.push(child);
    }
    if (child.childNodes.length > 0) {
      children.push(...getTaggedChildren(child));
    }
  }
  return children;
}
