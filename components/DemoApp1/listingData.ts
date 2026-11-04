import {
  getBrandIconImageUrl,
  getConfiguredImage,
  GetImageUrl,
  getUrlofProduct,
  RoundPrice,
} from "utils/server/helpers";
import { resolveCardPrice } from "components/products/ProductCard/flashPrice";
import type { ListingProduct } from "types/listing";

/**
 * The store page's data (Stage 7b of UI-MIGRATION-PLAN.md, A-16, A-32).
 *
 * Plain types and functions with no React in them. The listing pages read
 * Elasticsearch on the server and map the first page here; the next pages
 * are read in the browser and mapped by the same functions, so both give
 * the same shape. `/demo` maps its mock store into the same shape.
 *
 * Only `utils/server/helpers` is imported from utils: it is safe in client
 * bundles, unlike `utils/server` (which carries the translation tables).
 */

/** A logo drawn at a fixed height. `w` and `h` give its shape when known. */
export type MarkLogo = { src: string; w?: number; h?: number };

/** A store or a brand mark: its logo, or its name where it has none. */
export type ListingMark = { name: string; logo?: MarkLogo };

/** One colour of a product: its name, the photo of its dot, and its photos. */
export type CardColor = {
  /** The colour's name, in the page's language. */
  name: string;
  /** What the product page's address calls the colour (`?color=`). */
  key?: string;
  swatch: string;
  images: readonly string[];
};

/**
 * A label under the product's name.
 *  - `bag`: the shopper has it in the bag (S7b-3).
 *  - `best`: the file's "! Best price last N days!" (demo only: no source).
 *  - `flash`: a flash deal. `ends` is the deal's end date (a live countdown,
 *    S7b-11); the demo gives a fixed `days` and `time` instead.
 *  - `text`: a backend label (`label_names`), in the blue pill.
 */
export type CardLabel =
  | { kind: "bag"; count: number; size: string }
  | { kind: "best"; days: number }
  | { kind: "flash"; ends: string }
  | { kind: "flash"; days: number; time: string }
  | { kind: "text"; text: string };

/** A product card on the store page and in its colour sheet. */
export type StoreCard = {
  id: string;
  /** The product's page for each colour, in the order of `colors`. */
  links: readonly string[];
  /** The words of the name, in the page's language; the card puts a dot between two. */
  name: readonly string[];
  /** The mark in the footer: the product's brand (S7b-8). */
  mark: ListingMark;
  colors: readonly CardColor[];
  /** The colour the card opens on (an index in `colors`). */
  selected: number;
  /** The labels that take turns under the name. */
  labels: readonly CardLabel[];
  /** The price to pay now (S7b-2), as the page shows it. */
  price: string;
  currency: string;
  /** The photo's 0.5 px line. */
  line: string;
  /** The add button: purple when the product is in the bag. */
  inBag: boolean;
};

/** A category tile under the banner. */
export type ListingTile = {
  key: string;
  name: string;
  image: string;
  /** The listing with this category picked (S7b-7). */
  href: string;
  /** The name's colour on the photo. */
  color: string;
};

/** The currency fields the price rule reads. */
export type ListingCurrency = {
  exchange_rate?: number;
  decimal_digits?: number;
  symbol?: string;
} | null;

/** The card's photo size in the media server's resize (the live card's). */
const PHOTO_PX = { width: 400, height: 580 } as const;

/** The live photo line: the file's grey line on every card. */
const LINE = "#D3D3D3";

const text = (v: unknown) => (typeof v === "string" ? v.trim() : "");

/** The photos of one colour group, as addresses. */
function photosOf(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((image) =>
      getConfiguredImage({ src: GetImageUrl(image), ...PHOTO_PX }),
    )
    .filter((src): src is string => typeof src === "string" && src.length > 0);
}

/**
 * The colours of a product. With colour groups (`sync_color_images`), one
 * colour each, its dot the first photo, small. With none, one colour with
 * the product's own photos.
 */
function colorsOf(product: ListingProduct): CardColor[] {
  const groups = Array.isArray(product?.sync_color_images)
    ? product.sync_color_images
    : [];
  const colors = groups
    .map((group: any): CardColor | null => {
      const images = photosOf(group?.images);
      if (images.length === 0) return null;
      const name = text(group?.color_name);
      return {
        name,
        key: name || undefined,
        swatch: getConfiguredImage({
          src: GetImageUrl(group?.images?.[0]),
          height: 60,
        }),
        images,
      };
    })
    .filter((c): c is CardColor => c !== null);
  if (colors.length > 0) return colors;
  const images = photosOf(product?.images);
  return [{ name: "", swatch: images[0] ?? "", images }];
}

/** The product's brand: its icon, or its name (S7b-8). */
function markOf(product: ListingProduct): ListingMark {
  const brand = product?.brand;
  const icon = (brand?.icon as any)?.file_path ?? brand?.icon;
  const src =
    typeof icon === "string" || icon?.file_path
      ? getBrandIconImageUrl(icon, { width: 200, height: 30 })
      : "";
  return { name: text(brand?.name), logo: src ? { src } : undefined };
}

/**
 * One Elasticsearch product (already normalized, `normalizeListingProduct`)
 * as a card. `lang` is the page's `country-language`.
 *
 * Price (S7b-2): the price to pay now, by the live card's rule
 * (`resolveCardPrice`: the flash price while the deal runs, else the offer
 * price, else the price), rounded by the one price rule. The luck price is
 * not shown (S7b-4).
 *
 * The `bag` label and `inBag` depend on the shopper's cart, so the screen
 * adds them in the browser (`withBag`).
 */
export function toStoreCard(
  product: ListingProduct,
  lang: string,
  currency: ListingCurrency,
  now: Date,
): StoreCard {
  const [country, language] = lang.split("-");
  const colors = colorsOf(product);
  const { flashPrice, timeLeft } = resolveCardPrice(
    {
      endDate: product?.flash_deal_end_date,
      flashDealPrice: product?.flash_deal_price,
      offerPrice: product?.offer_price,
      price: product?.price,
    },
    now,
  );
  const labels: CardLabel[] = [];
  if (timeLeft && product?.flash_deal_end_date)
    labels.push({ kind: "flash", ends: product.flash_deal_end_date });
  for (const label of Array.isArray(product?.label_names)
    ? product.label_names
    : []) {
    const words = text(label);
    if (words) labels.push({ kind: "text", text: words });
  }
  const category = (product?.categories ?? [])
    .map((c) => text(c?.name))
    .filter(Boolean);
  const slug = product?.slug ?? "";
  return {
    id: String(product?.product_id ?? slug),
    links: colors.map(
      (color) =>
        getUrlofProduct(color.key, language, country, slug) ??
        `/${lang}/products/${slug}`,
    ),
    name: [text(product?.name), ...category].filter(Boolean),
    mark: markOf(product),
    colors,
    selected: 0,
    labels,
    price: String(
      RoundPrice({
        num: flashPrice ?? 0,
        rate: currency?.exchange_rate,
        points: currency?.decimal_digits,
      }),
    ),
    currency: currency?.symbol ?? "",
    line: LINE,
    inBag: false,
  };
}

/** A cart line, as the store keeps it (`store/Cart`, `localCart`). */
type CartLine = { id?: unknown; quantity?: unknown; size?: unknown };

/**
 * The card with the shopper's bag on it (S7b-3): the purple "N item SIZE in
 * your bag" label first and the purple add mark when the product is in the
 * bag. The sizes are the bag's lines' sizes, joined.
 */
export function withBag(card: StoreCard, cart: readonly CartLine[]): StoreCard {
  const lines = cart.filter((line) => String(line?.id) === card.id);
  if (lines.length === 0) return card;
  const count = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 1),
    0,
  );
  const sizes = [
    ...new Set(lines.map((line) => text(line.size)).filter(Boolean)),
  ];
  return {
    ...card,
    inBag: true,
    labels: [{ kind: "bag", count, size: sizes.join(", ") }, ...card.labels],
  };
}

/**
 * The category tiles (S7b-7): the categories of the result, as the live
 * category row lists them. The photo is the category's most-viewed product,
 * else its flat photo. A category with no photo is left out: a tile is a
 * photo. `href` builds the listing with that category picked.
 */
export function toListingTiles(
  categories: unknown,
  href: (slug: string) => string,
): ListingTile[] {
  if (!Array.isArray(categories)) return [];
  return categories
    .map((c: any): ListingTile | null => {
      const slug = text(c?.slug);
      const raw =
        c?.most_viewed_product_thumbnail || c?.flat_photo_path?.file_path || "";
      const image = raw
        ? getConfiguredImage({ src: GetImageUrl(raw), width: 200, height: 280 })
        : "";
      if (!slug || !image) return null;
      return {
        key: slug,
        name: text(c?.name),
        image,
        href: href(slug),
        color: "#FFFFFF",
      };
    })
    .filter((t): t is ListingTile => t !== null);
}

/** One colour dot, placed: which colour, its diameter, and its centre in px from the card's middle. */
export type PlacedSwatch = {
  index: number;
  d: number;
  dx: number;
  on: boolean;
};

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
    placed.push({
      index,
      d: ring.d,
      dx: Math.sign(step) * ring.x,
      on: step === 0,
    });
  }
  const left = Math.min(...placed.map((s) => s.dx - s.d / 2));
  const right = Math.max(...placed.map((s) => s.dx + s.d / 2));
  const shift = -(left + right) / 2;
  return placed
    .map((s) => ({ ...s, dx: s.dx + shift }))
    .sort(
      (a, b) =>
        Math.abs(b.index - selected) - Math.abs(a.index - selected) ||
        b.index - a.index,
    );
}
