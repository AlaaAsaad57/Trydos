/**
 * The stores the demo can open, and the products the store page lists.
 *
 * Plain data with no React in it, so two places share it:
 *  - the client screens (the Home cards and the store page), and
 *  - the server page at /[lang]/demo/store/[store] (its metadata, its
 *    JSON-LD and its static params).
 *
 * A store is opened at `/[lang]/demo/store/<slug>`. The slug is the store's
 * name in lower case. Every store opens the same page, `Home Page – 47`; the
 * page shows the store's own logo and name in it.
 */

/** A logo as the Home cards draw it, in design px. */
export type StoreLogo = {
  src: string;
  w: number;
  h: number;
  /** Design px under the card's top. */
  top: number;
  /** Design px from the card's left; omitted, the logo is centred. */
  left?: number;
};

export type DemoStore = {
  slug: string;
  name: string;
  /** The name as a card's line writes it in the file, where it differs ("boyner"). */
  shown?: string;
  /** Not every store has a logo in the file; those show their name instead. */
  logo?: StoreLogo;
};

const BRANDS_DIR = "/assets/demo/home/brands";

/**
 * Every store on Home. The logo boxes are the ones the Home cards use
 * (XD `Home Page – 2`). Zara, Mango and Vakko are the brand stores: the file
 * places their logos at an x of their own. The others are centred.
 */
export const DEMO_STORES: readonly DemoStore[] = [
  {
    slug: "zara",
    name: "Zara",
    logo: { src: `${BRANDS_DIR}/zara.svg`, w: 47.55, h: 20, top: 65, left: 85.22 },
  },
  {
    slug: "mango",
    name: "Mango",
    logo: { src: `${BRANDS_DIR}/mango.svg`, w: 124.36, h: 20.22, top: 64.95, left: 46.51 },
  },
  {
    slug: "vakko",
    name: "Vakko",
    logo: { src: `${BRANDS_DIR}/vakko.svg`, w: 110.15, h: 20, top: 65, left: 54 },
  },
  {
    slug: "ebebek",
    name: "Ebebek",
    logo: { src: `${BRANDS_DIR}/ebebek.svg`, w: 77.43, h: 20, top: 65 },
  },
  {
    slug: "boyner",
    name: "Boyner",
    shown: "boyner",
    logo: { src: `${BRANDS_DIR}/boyner.svg`, w: 140, h: 19.5, top: 65.25 },
  },
  {
    slug: "sephora",
    name: "Sephora",
    shown: "sephora",
    logo: { src: `${BRANDS_DIR}/sephora.svg`, w: 140, h: 18.14, top: 65.93 },
  },
  {
    slug: "gratis",
    name: "Gratis",
    shown: "gratis",
    logo: { src: `${BRANDS_DIR}/gratis.png`, w: 90, h: 50, top: 50 },
  },
  {
    slug: "beymen",
    name: "Beymen",
    shown: "beymen",
    logo: { src: `${BRANDS_DIR}/beymen.svg`, w: 140, h: 17.5, top: 66.25 },
  },
  {
    slug: "rossmann",
    name: "Rossmann",
    shown: "rossmann",
    logo: { src: `${BRANDS_DIR}/rossmann.svg`, w: 140, h: 19.31, top: 65.35 },
  },
  { slug: "koton", name: "Koton", shown: "koton" },
  { slug: "stradivarius", name: "Stradivarius", shown: "stradivarius" },
  { slug: "bershka", name: "Bershka" },
];

export const storeBySlug = (slug: string): DemoStore | undefined =>
  DEMO_STORES.find((store) => store.slug === slug);

/** The demo screen key of a store's page. */
export const storeScreen = (slug: string) => `store/${slug}` as const;

const LISTING_DIR = "/assets/demo/listing";

/**
 * The category tiles under the banner (XD `Home Page – 47`, y 242).
 *
 * The file draws five: four with a name, and a fifth that the screen's edge
 * cuts, with no name. The row is a slider, so it needs more than one screen
 * of tiles. The fifth gets a name ("Jacket": its photo is a jacket), and four
 * more follow, cut from other photos in the same file.
 */
export const LISTING_CATEGORIES = [
  { key: "T-Shirt", image: `${LISTING_DIR}/tile-tshirt.webp`, color: "#FFFFFF" },
  { key: "Shoes", image: `${LISTING_DIR}/tile-shoes.webp`, color: "#FFFFFF" },
  { key: "Mont", image: `${LISTING_DIR}/tile-mont.webp`, color: "#FCFCFC" },
  { key: "Craf", image: `${LISTING_DIR}/tile-craf.webp`, color: "#FCFCFC" },
  { key: "Jacket", image: `${LISTING_DIR}/tile-more.webp`, color: "#FFFFFF" },
  { key: "Shirt", image: `${LISTING_DIR}/tile-shirt.webp`, color: "#FFFFFF" },
  { key: "Pajama", image: `${LISTING_DIR}/tile-pajama.webp`, color: "#FFFFFF" },
  { key: "Jeans", image: `${LISTING_DIR}/tile-jeans.webp`, color: "#FFFFFF" },
  { key: "Blouse", image: `${LISTING_DIR}/tile-blouse.webp`, color: "#FFFFFF" },
] as const;

/** The words a colour's name can use (each is a translated key). */
export type ColorWord =
  | "blue"
  | "Pink"
  | "White"
  | "Indigo"
  | "Stripe"
  | "Mix"
  | "Yellow"
  | "Black"
  | "Floral"
  | "Grey";

/**
 * One colour of a product: its name, the small photo of its dot, and its
 * photos. The card opens on the first photo; a swipe on the card's photo
 * shows the next one.
 */
export type ProductColor = {
  name: ColorWord;
  swatch: string;
  images: readonly string[];
};

/** The line under the product's name. */
export type ProductBadge =
  | { kind: "bag"; count: number; size: string }
  | { kind: "best"; days: number }
  | { kind: "flash"; days: number; time: string };

export type DemoProduct = {
  id: string;
  /** The words of the name; the card puts a Medium dot between two words. */
  name: readonly ProductWord[];
  /** The photo the card opens on: the first photo of the colour on show. */
  image: string;
  /** The photo's 0.5 px line. */
  line: string;
  /** The first label under the name (the one the XD file draws). */
  badge: ProductBadge;
  /**
   * More labels after `badge`. With any, the card's labels take turns: they
   * slide from right to left, as on the shop's own product cards.
   */
  labels?: readonly ProductBadge[];
  /** The add button: purple when the product is in the bag. */
  addColor: "purple" | "dark";
  /** The product's colours, in the order of their dots, left to right. */
  colors: readonly ProductColor[];
  /** The colour the card opens on (an index in `colors`). */
  selected: number;
  price: number;
  currency: "USD";
};

const photo = (name: string) => `${LISTING_DIR}/product-${name}.webp`;
const swatch = (name: string) => `${LISTING_DIR}/swatch-${name}.webp`;

/**
 * The shirt's colours. The file draws the blue shirt with six photos (the
 * product page, `Home Page – 51`, in this order), the pink one with one
 * (`– 51`, "Available 2 Color"), and the white one with two (`– 47`'s
 * category row). The file has no other photo of the pink shirt.
 */
const SHIRT_BLUE: ProductColor = {
  name: "blue",
  swatch: swatch("shirt-blue"),
  images: [
    photo("shirt"),
    photo("shirt-side"),
    // The file's back view of the blue shirt (the "jeans" card shows it too).
    photo("jeans"),
    photo("shirt-front"),
    photo("shirt-flat"),
    photo("shirt-detail"),
  ],
};
const SHIRT_PINK: ProductColor = {
  name: "Pink",
  swatch: swatch("shirt-pink"),
  images: [photo("shirt-pink")],
};
const SHIRT_WHITE: ProductColor = {
  name: "White",
  swatch: swatch("shirt-white"),
  images: [photo("blouse"), photo("shirt-white-side")],
};

/** The shirt as `Home Page – 47` and `– 54` draw it: two colours, blue on show. */
const SHIRT_COLORS: readonly ProductColor[] = [SHIRT_BLUE, SHIRT_PINK];

/** The same shirt with its third colour, for the cards after the file's four. */
const SHIRT_ALL_COLORS: readonly ProductColor[] = [SHIRT_BLUE, SHIRT_PINK, SHIRT_WHITE];

const PAJAMA_STRIPE: ProductColor = {
  name: "Stripe",
  swatch: swatch("1"),
  images: [photo("pajama-stripe")],
};
const PAJAMA_YELLOW: ProductColor = {
  name: "Yellow",
  swatch: swatch("3"),
  images: [photo("pajama-yellow")],
};
const PAJAMA_MIX: ProductColor = {
  name: "Mix",
  swatch: swatch("2"),
  images: [photo("tshirt")],
};
const PAJAMA_INDIGO: ProductColor = {
  name: "Indigo",
  swatch: swatch("pajama"),
  images: [photo("pajama")],
};

/**
 * The pajama's seven dots in `Home Page – 47`, left to right. The file has
 * four pajama photos, so it repeats three of them; the dots stay as drawn.
 */
const PAJAMA_COLORS: readonly ProductColor[] = [
  PAJAMA_STRIPE,
  PAJAMA_YELLOW,
  PAJAMA_MIX,
  PAJAMA_INDIGO,
  PAJAMA_STRIPE,
  PAJAMA_MIX,
  PAJAMA_STRIPE,
];

/** The indigo pajama is the colour on show in the file (the middle dot). */
const PAJAMA_ON = 3;

/** One colour with one photo, for a product the file draws in one colour only. */
const single = (name: ColorWord, look: string): readonly ProductColor[] => [
  { name, swatch: swatch(look), images: [photo(look)] },
];

/** The same colours, with one colour's photos starting at `start`. */
const startingAt = (
  colors: readonly ProductColor[],
  index: number,
  start: string,
): readonly ProductColor[] =>
  colors.map((color, i) => {
    const at = color.images.indexOf(start);
    if (i !== index || at <= 0) return color;
    return { ...color, images: [...color.images.slice(at), ...color.images.slice(0, at)] };
  });

/** The words a product's name can use (each is a translated key). */
export type ProductWord =
  | "Women"
  | "Pajama"
  | "Pantaloon"
  | "Shirt"
  | "Blouse"
  | "T-Shirt"
  | "Jeans"
  | "Jacket"
  | "Shoes"
  | "Dress";

/** The name every card of the file shows. */
const FILE_NAME: readonly ProductWord[] = ["Women", "Pajama", "Pantaloon"];

type Look = Pick<DemoProduct, "name" | "colors" | "selected">;

/** A product's fields that follow from its colours. */
const withImage = (look: Look) => ({
  ...look,
  image: look.colors[look.selected].images[0],
});

const FILE_SHIRT: Look = { name: FILE_NAME, colors: SHIRT_COLORS, selected: 0 };
const FILE_PAJAMA: Look = { name: FILE_NAME, colors: PAJAMA_COLORS, selected: PAJAMA_ON };

/** The four cards of `Home Page – 47`, left to right and top to bottom. */
const FILE_PRODUCTS: readonly DemoProduct[] = [
  {
    id: "shirt-1",
    ...withImage(FILE_SHIRT),
    line: "#4A31E7",
    badge: { kind: "bag", count: 1, size: "M" },
    labels: [{ kind: "best", days: 3 }],
    addColor: "purple",
    price: 90,
    currency: "USD",
  },
  {
    id: "pajama-1",
    ...withImage(FILE_PAJAMA),
    line: "#D3D3D3",
    badge: { kind: "best", days: 3 },
    addColor: "dark",
    price: 90,
    currency: "USD",
  },
  {
    id: "shirt-2",
    ...withImage(FILE_SHIRT),
    line: "#EB945E",
    badge: { kind: "flash", days: 1, time: "12:23:19" },
    labels: [{ kind: "best", days: 3 }],
    addColor: "dark",
    price: 90,
    currency: "USD",
  },
  {
    id: "pajama-2",
    ...withImage(FILE_PAJAMA),
    line: "#D3D3D3",
    badge: { kind: "best", days: 3 },
    addColor: "dark",
    price: 90,
    currency: "USD",
  },
];

/**
 * The cards after the file's four. All photos come from the same XD file.
 * Each card opens on its own photo: a shirt card on one of the blue shirt's
 * photos, a pajama card on one of the pajama's colours.
 */
const MORE_LOOKS: readonly { id: string; look: Look }[] = [
  {
    id: "shirt-front",
    look: {
      name: ["Women", "Shirt"],
      colors: startingAt(SHIRT_ALL_COLORS, 0, photo("shirt-front")),
      selected: 0,
    },
  },
  { id: "pajama-yellow", look: { name: FILE_NAME, colors: PAJAMA_COLORS, selected: 1 } },
  { id: "blouse", look: { name: ["Women", "Blouse"], colors: SHIRT_ALL_COLORS, selected: 2 } },
  { id: "pajama-stripe", look: { name: ["Women", "Pajama"], colors: PAJAMA_COLORS, selected: 0 } },
  {
    id: "shirt-side",
    look: {
      name: ["Women", "Shirt"],
      colors: startingAt(SHIRT_ALL_COLORS, 0, photo("shirt-side")),
      selected: 0,
    },
  },
  { id: "tshirt", look: { name: ["Women", "T-Shirt"], colors: PAJAMA_COLORS, selected: 2 } },
  {
    id: "shirt-flat",
    look: {
      name: ["Women", "Shirt"],
      colors: startingAt(SHIRT_ALL_COLORS, 0, photo("shirt-flat")),
      selected: 0,
    },
  },
  { id: "jeans", look: { name: ["Women", "Jeans"], colors: single("blue", "jeans"), selected: 0 } },
  { id: "jacket", look: { name: ["Women", "Jacket"], colors: single("Black", "jacket"), selected: 0 } },
  { id: "dress", look: { name: ["Women", "Dress"], colors: single("Floral", "dress"), selected: 0 } },
  { id: "shoes", look: { name: ["Women", "Shoes"], colors: single("Grey", "shoes"), selected: 0 } },
];

/** The badges the extra cards take in turn (the file's three kinds). */
const MORE_BADGES: readonly ProductBadge[] = [
  { kind: "best", days: 3 },
  { kind: "flash", days: 2, time: "08:41:05" },
  { kind: "best", days: 5 },
  { kind: "bag", count: 1, size: "S" },
  { kind: "flash", days: 1, time: "19:02:47" },
];

/**
 * The labels a card shows after its first one. A card in the bag or with a
 * flash deal also has the best-price label, so its labels take turns; a card
 * with only the best price has one label, which stays still.
 */
const moreLabels = (badge: ProductBadge): readonly ProductBadge[] | undefined =>
  badge.kind === "best" ? undefined : [{ kind: "best", days: badge.kind === "flash" ? 5 : 3 }];

const MORE_PRICES = [65, 120, 45, 90, 75, 140, 55, 110, 80];

/** How many cards the page shows at first, and how many each "next page" adds. */
export const LISTING_PAGE_SIZE = 12;

/** All the cards of a store, in three pages. */
const CATALOG_SIZE = LISTING_PAGE_SIZE * 3;

/**
 * Every card a store lists: the file's four first, then cards made from
 * MORE_LOOKS, so the page has three pages to load. The data is the same on
 * every run (no random numbers), so the server and the client agree.
 */
export const LISTING_PRODUCTS: readonly DemoProduct[] = [
  ...FILE_PRODUCTS,
  ...Array.from({ length: CATALOG_SIZE - FILE_PRODUCTS.length }, (_, i): DemoProduct => {
    const { id, look } = MORE_LOOKS[i % MORE_LOOKS.length];
    const badge = MORE_BADGES[i % MORE_BADGES.length];
    const inBag = badge.kind === "bag";
    return {
      id: `${id}-${i + 1}`,
      ...withImage(look),
      // In the file, a card in the bag has a purple line; a flash deal, orange.
      line: inBag ? "#4A31E7" : badge.kind === "flash" ? "#EB945E" : "#D3D3D3",
      badge,
      labels: moreLabels(badge),
      addColor: inBag ? "purple" : "dark",
      price: MORE_PRICES[i % MORE_PRICES.length],
      currency: "USD",
    };
  }),
];

/** One colour dot, placed: which colour, its diameter, and its centre in px from the card's middle. */
export type PlacedSwatch = { index: number; d: number; dx: number; on: boolean };

/**
 * The dots by their distance from the colour on show (0 is that colour): the
 * diameter, and how far the centre is from it. Read from `Home Page – 47`'s
 * pajama, which draws all seven: 22 in the middle, then 20, 18 and 12 on each
 * side, at 11, 21 and 30 px. A colour further away has no dot.
 */
export const SWATCH_RING: readonly { d: number; x: number }[] = [
  { d: 22, x: 0 },
  { d: 20, x: 11 },
  { d: 18, x: 21 },
  { d: 12, x: 30 },
];

/**
 * Where the colour dots go when colour `selected` of `count` is on show.
 *
 * The dots form a row round the colour on show, by SWATCH_RING, and the row
 * as a whole is centred on the card. This gives both rows the file draws:
 *  - the pajama (7 colours, the 4th on show): 12, 18, 20, 22, 20, 18, 12 at
 *    -30, -21, -11, 0, 11, 21, 30;
 *  - the shirt (2 colours, the 1st on show): 22 at -5 and 20 at 6.
 * The list is in drawing order: the further a dot, the earlier, so a nearer
 * dot lies over it, and the colour on show lies over all.
 */
export function placeSwatches(count: number, selected: number): PlacedSwatch[] {
  const far = SWATCH_RING.length - 1;
  const placed: PlacedSwatch[] = [];
  for (let index = 0; index < count; index += 1) {
    const step = index - selected;
    const away = Math.abs(step);
    if (away > far) continue;
    const ring = SWATCH_RING[away];
    placed.push({ index, d: ring.d, dx: Math.sign(step) * ring.x, on: step === 0 });
  }
  const left = Math.min(...placed.map((s) => s.dx - s.d / 2));
  const right = Math.max(...placed.map((s) => s.dx + s.d / 2));
  const shift = -(left + right) / 2;
  return placed
    .map((s) => ({ ...s, dx: s.dx + shift }))
    .sort((a, b) => Math.abs(b.index - selected) - Math.abs(a.index - selected) || b.index - a.index);
}

/** The cards of page `page` (1 is the first). */
export const listingPage = (page: number) =>
  LISTING_PRODUCTS.slice((page - 1) * LISTING_PAGE_SIZE, page * LISTING_PAGE_SIZE);

/** How many pages a store has. */
export const LISTING_PAGES = Math.ceil(LISTING_PRODUCTS.length / LISTING_PAGE_SIZE);

/** The pictures the store page shows first, to load before it opens. */
export const LISTING_FIRST_IMAGES = [
  ...LISTING_CATEGORIES.slice(0, 5).map((c) => c.image),
  `${LISTING_DIR}/product-shirt.webp`,
  `${LISTING_DIR}/product-pajama.webp`,
];

/** A product of the store page, by its id (the same products in every store). */
export const productById = (id: string): DemoProduct | undefined =>
  LISTING_PRODUCTS.find((product) => product.id === id);

/** The demo screen key of a product's page, under its store. */
export const productScreen = (slug: string, id: string) =>
  `store/${slug}/${id}` as const;
