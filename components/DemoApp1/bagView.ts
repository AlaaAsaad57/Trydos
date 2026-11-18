import type { ListingMark } from "./listingData";

/**
 * What the bag (XD `Home Page – 50`), the checkout (`– 56`) and the purchase
 * done (`– 103`) draw, as plain data (Stage 7d).
 *
 * The design screens draw only this. `/demo` maps its own bag into it
 * (CartScreen's default export), and the real app maps the shopper's cart
 * (useBagData). So shipping code never reads the demo's data files (A-16).
 *
 * Every text here is ready to draw: names, colours and sizes are already in
 * the page's language, and prices are already rounded and converted.
 */

/**
 * A label beside an item's quantity box.
 *  - `best`, `trend`, `sell`: the product's labels; they take turns in one place.
 *  - `hurry`: the stock runs out ("quantity running out -3").
 *  - `hurryTime`: the offer's time runs out ("time running out -12:30").
 */
export type BagLabel =
  | { kind: "best"; days: number }
  | { kind: "trend" }
  | { kind: "sell" }
  | { kind: "hurry"; time: string }
  | { kind: "hurryTime"; time: string };

/** One item, in the bag or out of it. */
export type BagItemView = {
  id: string;
  photo: string;
  /** The words of the name; the row puts a Medium dot between two. */
  name: readonly string[];
  /** The store's or the brand's mark over the name. */
  mark: ListingMark;
  /** The colour's name; empty: the row has no colour line. */
  color: string;
  /** The size ("Medium 38"); empty: the row has no size line. */
  size: string;
  /** The "Composed of" value ("1 piece"); empty: no such line. */
  pieces: string;
  qty: number;
  /** What the row's quantity costs, as the page writes it, and its currency. */
  price: string;
  currency: string;
  labels: readonly BagLabel[];
  /** An item out of the bag: the time it has left ("29:15"); empty when it ran out. */
  outTime?: string;
  /**
   * The item cannot be bought now: the words that say why ("Out Of Stock").
   * The row shows them in red under the price line (S7d-11).
   */
  problem?: string;
  /** A request for this row is on its way: its buttons wait. */
  busy?: boolean;
};

/** The sum of the bag, and the price details under it. */
export type BagSums = {
  /** How many pieces ("2 item"). */
  count: number;
  /** What the bag costs now. */
  total: string;
  /** What it cost before the offers (struck through); null when the same. */
  was: string | null;
  currency: string;
  /** Free shipping on the whole bag (the backend's shipping cost is 0). */
  freeShipping: boolean;
  /** Every item can be sent back (its return days are over 0). */
  freeReturn: boolean;
  /** "just N days In your hands"; null: unknown, the chip is not shown. */
  days: number | null;
};

/** The bag as the design draws it. */
export type BagView = {
  items: readonly BagItemView[];
  out: readonly BagItemView[];
  sums: BagSums;
};
