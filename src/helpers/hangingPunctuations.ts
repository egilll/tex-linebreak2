/**
 * "It is easy to get inserted hyphens into the margin: We simply let the width of the corresponding penalty item be zero. And it is almost as easy to do the same for periods and other symbols, by putting every such character in a box of width zero and adding the actual symbol width to the glue that follows. If no break occurs at this glue, the accumulated width is the same as before; and if a break does occur, the line will be justified as if the period or other symbol were not present."
 */

/**
 * Em hyphens are not included here.
 */
const hangingPunctuation = '.,;:!?-()[]{}<>\'"';
const initialQuotes = /\p{General_Category=Pi}/u;
const finalQuotes = /\p{General_Category=Pf}/u;
