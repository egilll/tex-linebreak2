import { hyphenateHTMLSync } from "hyphen/en";
import { splitTextIntoItems } from "src/splitTextIntoItems/splitTextIntoItems";

console.log(
  splitTextIntoItems("\n", {
    measureFn: (word) => word.length,
    lineWidth: 100,
  })
);

console.log(
  hyphenateHTMLSync(
    `“Young man,” he went on, raising his head again, “in your face I seem to read some trouble of mind. When you came in I read it, and that was why I addressed you at once. For in unfolding to you the story of my life, I do not wish to make myself a laughing-stock before these idle listeners, who indeed know all about it already, but I am looking for a man of feeling and education. Know then that my wife was educated in a high-class school for the daughters of noblemen, and on leaving she danced the shawl dance before the governor and other personages for which she was presented with a gold medal and a certificate of merit. The medal... well, the medal of course was sold—long ago, hm... but the certificate of merit is in her trunk still and not long ago she showed it to our landlady. And although she is most continually on bad terms with the landlady, yet she wanted to tell someone or other of her past honours and of the happy days that are gone. I don’t condemn her for it, I don’t blame her, for the one thing left her is recollection of the past, and all the rest is dust and ashes.`
  )
);
