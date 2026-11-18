import type { ListingMark } from "./listingData";
import type { ProductColorView } from "./productData";
import type { BuySize, BuyView } from "./screens/ProductBuy";

/**
 * The buy bar's data on the real product page (Stage 7d, S7d-9, S7d-10).
 *
 * Plain functions with no React in them. `product` is the old add sheet's
 * `ProductData`: the product's search record with its prices and stock
 * (`qtyPriceDetails`, the variants under `variation`) and the shopper's
 * notify flags. The rules are the old sheet's (components/Cart/AddToCart).
 */

/** The old sheet writes a size's `_` as `-`. */
const normal = (size: unknown) => (typeof size === "string" ? size.replace(/_/g, "-") : size);

/** The product's sizes, in order (the old `buildSizeOptions`). None: the product has no sizes. */
export function sizesOf(product: any): string[] {
  const choice = product?.choice_options?.[0]?.options;
  if (Array.isArray(choice) && choice.length > 0)
    return choice.map((option: any) => String(option?.option ?? option)).filter(Boolean);
  const fromField = Array.isArray(product?.sizes) ? product.sizes : [];
  const fromVariants = Array.isArray(product?.variation)
    ? product.variation.map((v: any) => v?.size).filter(Boolean)
    : [];
  const all = [...fromField, ...fromVariants]
    .map((s) => (typeof s === "string" ? s.trim() : s))
    .filter(Boolean)
    .map((s) => String(normal(s)));
  return [...new Set(all)];
}

/** The product's colour row (`sync_color_images`) that `?color=` calls by one of these keys. */
export function colorRowOf(product: any, keys: readonly string[]): any {
  if (keys.length === 0) return null;
  return (
    (product?.sync_color_images ?? []).find(
      (row: any) => keys.includes(row?.color_option) || keys.includes(row?.color_name),
    ) ?? null
  );
}

/** The variant of this colour and size (the old `findVariantForSelection`). */
export function variantOf(product: any, keys: readonly string[], size: string | null): any {
  const variants = product?.variation ?? [];
  if (variants.length === 0) return null;
  const row = colorRowOf(product, keys);
  const color = row?.color_name ?? row?.color_option;
  const value = normal(size);
  if (color && value)
    return variants.find((v: any) => v.color?.name === color && normal(v.size) === value) ?? null;
  if (color) return variants.find((v: any) => v.color?.name === color) ?? null;
  if (value) return variants.find((v: any) => normal(v.size) === value) ?? null;
  return variants[0] ?? null;
}

/** A price as the page writes it. */
export type Round = (value: number) => string;

/** The old price (when it is more) and the price to pay. */
function priceOf(price: unknown, offer: unknown, round: Round): BuySize["price"] {
  const full = Number(price) || 0;
  const pay = Number(offer) || full;
  return { was: full > pay ? round(full) : null, now: round(pay) };
}

/**
 * The sizes of one colour. The stock is the variant's `qty`; a product made
 * after the order (`packed_after_ordering`) has no count. An inactive or
 * country-restricted product is sold out everywhere, as in the old sheet.
 */
function colorSizes(product: any, keys: readonly string[], oneSize: string, round: Round): BuySize[] {
  const blocked = product?.is_active === false || Boolean(product?.is_country_restricted);
  const made = product?.packed_after_ordering === 1;
  const hasVariants = (product?.variation?.length ?? 0) > 0;
  const stockOf = (variant: any) => {
    if (blocked) return 0;
    if (made) return null;
    if (!hasVariants) return Math.max(0, Number(product?.available_quantity) || 0);
    return Math.max(0, Number(variant?.qty) || 0);
  };
  const named = sizesOf(product);
  const values: (string | null)[] = named.length > 0 ? named : [null];
  return values.map((value) => {
    const variant = hasVariants ? variantOf(product, keys, value) : null;
    const source = variant ?? product;
    return {
      code: value ?? oneSize,
      number: null,
      word: value ?? oneSize,
      stock: stockOf(variant),
      notified: Boolean(hasVariants ? variant?.variant_notify_for_user : product?.is_product_notify_for_user),
      price: priceOf(source?.price, source?.offer_price, round),
    };
  });
}

/** The first size with something left, else the first (S7d-10). */
const firstInStock = (sizes: readonly BuySize[]) => Math.max(0, sizes.findIndex((size) => size.stock !== 0));

/** The bar and the sheet, from the product and the colours the page shows. */
export function toBuyView({
  product,
  colors,
  words,
  mark,
  currency,
  counts,
  oneSize,
  round,
}: {
  product: any;
  colors: readonly ProductColorView[];
  /** The name's words, before the colour. */
  words: readonly string[];
  mark: ListingMark;
  currency: string;
  counts: BuyView["counts"];
  /** What a product with no sizes calls its one size. */
  oneSize: string;
  round: Round;
}): BuyView {
  const sizes = colors.map((color) => colorSizes(product, color.keys, oneSize, round));
  const price = priceOf(product?.price, product?.offer_price, round);
  return {
    card: {
      id: String(product?.id ?? ""),
      links: colors.map(() => ""),
      name: words,
      mark,
      colors: colors.map((color) => ({
        name: color.name,
        key: color.key,
        swatch: color.tile,
        images: color.photos.map((photo) => photo.src),
      })),
      selected: 0,
      labels: [],
      price: price.now,
      currency,
      line: "#D3D3D3",
      inBag: false,
    },
    sizes,
    recommended: sizes.map(firstInStock),
    rings: colors.map((color) => color.photos[0]?.src ?? color.tile),
    price,
    currency,
    counts,
  };
}
