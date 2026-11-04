/**
 * A product's page in the demo: the data the page shows, by XD `Home Page – 49`.
 *
 * Plain data with no React in it, so two places share it:
 *  - the client screen (components/DemoApp1/screens/ProductScreen.tsx), and
 *  - the server page at /[lang]/demo/store/[store]/[product] (its metadata
 *    and its JSON-LD).
 *
 * Every product opens the same page. The page shows the product's own photos,
 * colours and name; the rest (the details, the shipping, the reviews and the
 * questions) is the file's text for every product. The data is the same on
 * every run (no random numbers, no dates from the clock), so the server and
 * the client print the same HTML.
 */

import type { DemoKey } from "./demoKeys";
import type { ColorWord, DemoProduct, ProductColor, ProductWord } from "./demoStores";

const LISTING_DIR = "/assets/demo/listing";
const PRODUCT_DIR = "/assets/demo/product";

/** The photo slot of the gallery, in design px. */
export const GALLERY_PHOTO = { w: 319, h: 464 } as const;

/**
 * The gallery's photos at 3x (957 x 1392), cut from the file's own photos
 * the way XD fills the slot (cover, centred). The store page's photos are
 * 642 px wide (2x for its 214 px cards), so a phone at 3x gets these.
 */
const GALLERY_3X: Readonly<Record<string, string>> = {
  [`${LISTING_DIR}/product-shirt.webp`]: `${PRODUCT_DIR}/gallery-shirt.webp`,
  [`${LISTING_DIR}/product-shirt-side.webp`]: `${PRODUCT_DIR}/gallery-shirt-side.webp`,
  [`${LISTING_DIR}/product-jeans.webp`]: `${PRODUCT_DIR}/gallery-jeans.webp`,
  [`${LISTING_DIR}/product-shirt-front.webp`]: `${PRODUCT_DIR}/gallery-shirt-front.webp`,
  [`${LISTING_DIR}/product-shirt-flat.webp`]: `${PRODUCT_DIR}/gallery-shirt-flat.webp`,
  [`${LISTING_DIR}/product-shirt-detail.webp`]: `${PRODUCT_DIR}/gallery-shirt-detail.webp`,
  [`${LISTING_DIR}/product-shirt-pink.webp`]: `${PRODUCT_DIR}/gallery-shirt-pink.webp`,
};

/** The `srcSet` of a gallery photo: the 2x photo, and the 3x one where the file has it. */
export function gallerySrcSet(src: string): string | undefined {
  const big = GALLERY_3X[src];
  return big ? `${src} 642w, ${big} 957w` : undefined;
}

/**
 * The colour tiles (70 x 98 in the file), at 3x. The tile is a little wider
 * for its height than the gallery slot, so it is its own cut. A colour with
 * no cut of its own shows its first photo, cut by the browser (cover).
 */
const COLOR_TILE: Readonly<Record<string, string>> = {
  [`${LISTING_DIR}/product-shirt.webp`]: `${PRODUCT_DIR}/color-shirt.webp`,
  [`${LISTING_DIR}/product-shirt-pink.webp`]: `${PRODUCT_DIR}/color-shirt-pink.webp`,
};

export const colorTileOf = (color: ProductColor) =>
  COLOR_TILE[color.images[0]] ?? color.images[0];

/** The video card over the gallery (121 x 170 in the file) shows this cut of the back view. */
const VIDEO_POSTER: Readonly<Record<string, string>> = {
  [`${LISTING_DIR}/product-jeans.webp`]: `${PRODUCT_DIR}/video-jeans.webp`,
};

/**
 * The photos of a product's page: the photos of the colour on show. A colour
 * with a single photo gets the first photo of each other colour after it, so
 * the gallery still has more than one photo to swipe to.
 */
export function galleryOf(product: DemoProduct, colorIndex: number): readonly string[] {
  const color = product.colors[colorIndex] ?? product.colors[product.selected];
  if (color.images.length > 1) return color.images;
  const more = product.colors.map((c) => c.images[0]);
  return [...new Set([color.images[0], ...more])];
}

/** The video card's picture: the third photo, as in the file (the back view), or the last one. */
export function videoPosterOf(gallery: readonly string[]): string {
  const photo = gallery[2] ?? gallery[gallery.length - 1];
  return VIDEO_POSTER[photo] ?? photo;
}

/** The pictures a product's page shows first, in colour `colorIndex`, to load before it opens. */
export function productFirstImages(product: DemoProduct, colorIndex: number): string[] {
  const gallery = galleryOf(product, colorIndex);
  return [gallery[0], gallery[1], videoPosterOf(gallery)].filter(Boolean);
}

/**
 * The product's name on its page: its words and its colour, with a Medium
 * dot between two words ("Women . pajama . Pantaloon . Denim blue").
 *
 * The file writes "pajama" in lower case here (the store page's card writes
 * "Pajama"), and calls the blue shirt's colour "Denim blue".
 */
const PAGE_WORD: Partial<Record<ProductWord, DemoKey>> = { Pajama: "pajama" };
const PAGE_COLOR: Partial<Record<ColorWord, DemoKey>> = { blue: "Denim blue" };

export function titleWords(product: DemoProduct, color: ProductColor): DemoKey[] {
  return [
    ...product.name.map((word) => PAGE_WORD[word] ?? word),
    PAGE_COLOR[color.name] ?? color.name,
  ];
}

/** The numbers of the rating row and the reviews, as the file writes them. */
export const PRODUCT_STATS = {
  /** 3 of 5 stars. */
  stars: 3,
  raters: 368,
  views: "200k",
  recommend: 215,
  notRecommend: 15,
  likes: "110k",
} as const;

/** The size the buyers say the product has: the label, the share and the bar's fill (of 130 px). */
export const SIZE_VOTES = [
  { key: "True", share: "70%", fill: 103 / 130, gap: 5 },
  { key: "Small", share: "3%", fill: 14 / 130, gap: 3 },
  { key: "Large", share: "1%", fill: 8 / 130, gap: 3 },
] as const satisfies readonly { key: DemoKey; share: string; fill: number; gap: number }[];

/** The share of buyers that recommend the product: 369 of the bar's 402 px in the file. */
export const RECOMMEND_SHARE = 369 / 402;

/** The names on the reviews and the questions, as the file writes them (people's names are not translated). */
export const REVIEWER = "Yxxx Oxxx";

/**
 * The colour a store page's card showed when it was tapped, by product id,
 * so the product's page opens on the same colour. Only a tap writes it, in
 * the browser: a page from the server opens on the product's own colour, and
 * the first render in the browser finds nothing here, so it matches the HTML.
 */
const openColors = new Map<string, number>();

export function openProductInColor(id: string, colorIndex: number) {
  openColors.set(id, colorIndex);
}

export const openColorOf = (id: string): number | undefined => openColors.get(id);
