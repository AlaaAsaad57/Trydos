import { translateFunction } from "./functions";

export const getPrice = (num, lang, currency) => {
  let rateVariable = currency?.exchange_rate;
  let price = parseFloat(num);
  price = parseFloat((price * rateVariable).toFixed(0));
  let ceil = 2;
  if (price >= 1000000) {
    return (
      (ceil
        ? Math.ceil(parseFloat((price / 1000000).toFixed(3)) * ceil) / ceil
        : parseFloat((price / 1000000).toFixed(3))) +
      translateFunction("M", lang)
    ); // For millions
  } else if (price >= 1000) {
    return (
      (ceil
        ? Math.ceil(parseFloat((price / 1000).toFixed(3)) * ceil) / ceil
        : parseFloat((price / 1000).toFixed(3))) + translateFunction("K", lang)
    ); // For thousands
  } else {
    return price; // For prices under 1000
  }
};
