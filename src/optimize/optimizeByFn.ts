import { breakLines, LineBreakingNode } from "src/breakLines";
import { TexLinebreak } from "src/index";

export const optimizeByFn = (obj: TexLinebreak): number[] => {
  const func = obj.options.optimizeByFn!;
  const lineBreakingNodes: LineBreakingNode[] = breakLines(
    obj.items,
    obj.options,
    true
  );

  return lineBreakingNodes.map((i) => i.index);
};
