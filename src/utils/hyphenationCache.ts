import { TexLinebreakOptions } from "src/options";

const cache: Map<string, string[]> = new Map();

/** (Todo: Make case-insensitive) */
export function getHyphenateFnCached(
  hyphenateFn: TexLinebreakOptions["hyphenateFn"]
): TexLinebreakOptions["hyphenateFn"] {
  return function (input: string): string[] {
    if (input.length <= 1) return [input];
    const cached = cache.get(input);
    if (cached) return cached;
    const result = hyphenateFn!(input);
    cache.set(input, result);
    return result;
  };
}
