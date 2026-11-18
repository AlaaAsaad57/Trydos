/**
 * The shopper's bag: what XD `Home Page – 50` (the bag) and `– 56` (the
 * checkout) show.
 *
 * Plain data with no React in it. The bag lives in the demo's data provider
 * (DemoData.tsx), so a change on one screen is still there on the next one.
 * The starting items are the file's: two Mango items in the bag, and one
 * whose time in the bag ran out, waiting under the list to be added again.
 */

import type { DemoKey } from "./demoKeys";
import {
  productById,
  storeBySlug,
  type DemoProduct,
  type DemoStore,
  type ProductColor,
} from "./demoStores";

/**
 * A label under an item's price line: the product's labels (best price,
 * trend colour, best sell, as on the product page), or the running-out
 * warning.
 */
export type BagLabel =
  | { kind: "best"; days: number }
  | { kind: "trend" }
  | { kind: "sell" }
  | { kind: "hurry"; time: string };

/**
 * The product's own labels, which take turns in the bag. The file draws only
 * "Best price" on each item; the owner asked for the product page's three, in
 * the bag's own pill look.
 */
const PRODUCT_LABELS: readonly BagLabel[] = [{ kind: "best", days: 3 }, { kind: "trend" }, { kind: "sell" }];

export type DemoBagItem = {
  id: string;
  productId: string;
  storeSlug: string;
  /** An index in the product's colours. */
  colorIndex: number;
  /** The size's word and its number ("Medium 38"). */
  size: { word: DemoKey; number: number };
  /** How many of it. */
  qty: number;
  /** One piece's price now, and before the offer (the file's 160 and 200). */
  price: number;
  was: number;
  /** The pieces one item is made of ("Composed of . 1 piece"). */
  pieces: number;
  labels: readonly BagLabel[];
  /**
   * `out`: its time in the bag ran out. It is drawn faint under the list,
   * with the time it has left, and "Add again" puts it back.
   */
  status: "in" | "out";
  /** The time an `out` item has left, as the file writes it ("30:00"). */
  outTime?: string;
};

const MEDIUM = { word: "Medium", number: 38 } as const;

/** The file's bag: the indigo pajama and the pink shirt in it, a second pink shirt out of it. */
export const DEMO_BAG: readonly DemoBagItem[] = [
  {
    id: "bag-1",
    productId: "pajama-1",
    storeSlug: "mango",
    colorIndex: 3,
    size: MEDIUM,
    qty: 1,
    price: 160,
    was: 200,
    pieces: 1,
    labels: PRODUCT_LABELS,
    status: "in",
  },
  {
    id: "bag-2",
    productId: "shirt-1",
    storeSlug: "mango",
    colorIndex: 1,
    size: MEDIUM,
    qty: 1,
    price: 160,
    was: 200,
    pieces: 1,
    labels: [...PRODUCT_LABELS, { kind: "hurry", time: "20:00" }],
    status: "in",
  },
  {
    id: "bag-3",
    productId: "shirt-1",
    storeSlug: "mango",
    colorIndex: 1,
    size: MEDIUM,
    qty: 1,
    price: 160,
    was: 200,
    pieces: 1,
    labels: [],
    status: "out",
    outTime: "30:00",
  },
];

/** The items in the bag, in order. */
export const inBag = (bag: readonly DemoBagItem[]) =>
  bag.filter((item) => item.status === "in");

/** The items whose time ran out. */
export const outOfBag = (bag: readonly DemoBagItem[]) =>
  bag.filter((item) => item.status === "out");

/** How many pieces the bag holds ("2 item"). */
export const bagCount = (bag: readonly DemoBagItem[]) =>
  inBag(bag).reduce((n, item) => n + item.qty, 0);

/** What the bag costs now, and what it cost before the offers ("400 320 usd"). */
export const bagTotal = (bag: readonly DemoBagItem[]) =>
  inBag(bag).reduce((n, item) => n + item.qty * item.price, 0);
export const bagWas = (bag: readonly DemoBagItem[]) =>
  inBag(bag).reduce((n, item) => n + item.qty * item.was, 0);

/** What a bag item looks like: its product, its store, its colour and the photo the bag shows. */
export function bagLook(item: DemoBagItem): {
  product: DemoProduct;
  store: DemoStore;
  color: ProductColor;
  photo: string;
} {
  const product = productById(item.productId);
  const store = storeBySlug(item.storeSlug);
  if (!product || !store)
    throw new Error(`The bag item ${item.id} names a product or a store the demo does not have`);
  const color = product.colors[item.colorIndex] ?? product.colors[product.selected];
  return { product, store, color, photo: color.images[0] };
}

/** One more of an item. */
export const addOne = (bag: readonly DemoBagItem[], id: string) =>
  bag.map((item) => (item.id === id ? { ...item, qty: item.qty + 1 } : item));

/** One less of an item; the last one takes the item out of the list. */
export const takeOne = (bag: readonly DemoBagItem[], id: string) =>
  bag.flatMap((item) =>
    item.id !== id ? [item] : item.qty > 1 ? [{ ...item, qty: item.qty - 1 }] : [],
  );

/** An item whose time ran out goes back into the bag, after the others. */
export const addAgain = (bag: readonly DemoBagItem[], id: string) => {
  const found = bag.find((item) => item.id === id);
  if (!found) return bag;
  const back: DemoBagItem = { ...found, status: "in", outTime: undefined };
  return [...inBag(bag), back, ...outOfBag(bag).filter((item) => item.id !== id)];
};
