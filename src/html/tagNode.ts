export const NODE_TAG = "insertedByTexLinebreak";

/** Mark a node as having been created by `justifyContent`. */
export function tagNode<T extends Node>(node: T): T {
  (node as any)[NODE_TAG] = true;
  return node;
}

/** Return `true` if `node` was created by `justifyContent`. */
export function isTaggedNode(node: Node) {
  return node.hasOwnProperty(NODE_TAG);
}

/** Return all descendants of `node` created by `justifyContent`. */
export function getTaggedChildren(node: Node): Node[] {
  const children = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    const child = node.childNodes[i];
    if (isTaggedNode(child)) {
      children.push(child);
    }
    if (child.childNodes.length > 0) {
      children.push(...getTaggedChildren(child));
    }
  }
  return children;
}
