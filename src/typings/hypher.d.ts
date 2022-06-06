declare module "hypher" {
  export interface Patterns {
    id: string;
    leftmin: number;
    rightmin: number;
    patterns: {
      [key: string]: string;
    };
  }

  export default class Hypher {
    constructor(p: Patterns);

    hyphenate(word: string): string[];
    hyphenateText(text: string): string;
  }
}

declare module "hyphenation.en-us" {
  import { Patterns } from "hypher";
  let p: Patterns;
  export default p;
}
