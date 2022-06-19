import { TexLinebreakOptions } from "src/options";
import { glue, penalty, textBox, TextItem } from "src/utils/items";
import { getMinLineWidth } from "src/utils/lineWidth";
import { addSlackIfBreakpoint, infiniteGlue } from "src/utils/utils";

/** TODO: Needs rework */
export function forciblySplitLongWords(
  items: TextItem[],
  options: TexLinebreakOptions
): TextItem[] {
  if (options.lineWidth == null) {
    throw new Error("lineWidth must be set");
  }
  let output: TextItem[] = [];
  const minLineWidth = getMinLineWidth(options.lineWidth);
  items.forEach((item) => {
    if (item.type === "box" && item.text && item.width > minLineWidth) {
      output.push(infiniteGlue());
      for (let i = 0; i < item.text.length; i++) {
        const char = item.text[i];
        output.push(...textBox(char, options));
        /** Add penalty */
        // Separators
        if (/\p{General_Category=Z}/u.test(char)) {
          output.push(...addSlackIfBreakpoint(item.width * 0.2, 300));
        }
        // Punctuation
        else if (/\p{General_Category=P}/u.test(char)) {
          output.push(...addSlackIfBreakpoint(item.width * 0.1, 500));
        } else {
          output.push(penalty(0, 999));
        }
      }
      output.push(glue(0, item.width, 0));
    } else {
      output.push(item);
    }
  });
  return output;
}
