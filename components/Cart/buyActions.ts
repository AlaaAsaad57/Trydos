import { useAppStore } from "store";
import cart from "services/cart";
import auth from "services/auth";
import home from "services/home";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { getCart, LogError, translateFunction } from "utils/functions";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { isLuckActive } from "utils/luck";
import { findBagLine, resolveShowedPrice, showedPriceChange } from "utils/cart/pricing";
import { DetectScreen } from "utils/tinyUtils";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";
import { showErrorNotification, showSuccessNotification } from "@/store/notifications/reducer";
import { showErrorMessage } from "components/global/AddToCartMessage";
import { colorRowOf, variantOf } from "components/DemoApp1/buyData";

/*
  What the buy bar does, for the new product page (Stage 7d, AppProductBuy).

  Each action is the old add sheet's own logic (components/Cart/AddToCart:
  AddToCartComponent.tsx, Button.tsx and its notify button), with the same
  requests, the same store writes and the same analytics events (D-10). Only
  the drawing is new: the old sheet's button moves and words are not used.

  `product` is the old sheet's `ProductData`: the product's search record with
  its prices and stock (`qtyPriceDetails`, the variants under `variation`) and
  the shopper's notify flags.
*/

/** What the shopper picked: the colour (its keys, as `?color=` has them) and the size. */
export type BuyPick = {
  product: any;
  colorKeys: readonly string[];
  /** The size's value. Null: the product has no sizes. */
  size: string | null;
  /** The shopper changed the colour or the size before the tap (the old `add_to_cart` fields). */
  colorChanged?: boolean;
  sizeChanged?: boolean;
};

/** A new bag line costs something else than the bar showed: the shopper is asked. */
export type PriceChange = { itemId: any; from: number; to: number };

/** The old sheet's `getSelectedVariantQty`: the picked variant, or the product's own fields. */
export function pickedVariant({ product, colorKeys, size }: BuyPick): any {
  if (product?.variation?.length > 0) {
    const variant = variantOf(product, colorKeys, size);
    return {
      ...variant,
      offer_price: variant?.offer_price,
      luck_price: variant?.luck_price ?? product?.luck_price,
    };
  }
  return {
    product_variation_id: null,
    price: product?.price,
    offer_price: product?.offer_price,
    luck_price: product?.luck_price,
    qty: product?.available_quantity,
    variant_notify_for_user: product?.is_product_notify_for_user,
  };
}

const variantIdOf = (variant: any) =>
  variant?.product_variation_id ?? variant?.id ?? variant?.variation_id ?? null;

/** The bag line of the picked variant (the old `isVariantInCart`). */
export function bagLineOf(pick: BuyPick, exact = false): any {
  const { localCart } = useAppStore.getState();
  const id = pick.product?.id;
  if (!pick.product?.variation?.length) return localCart?.find((s) => s.id === id);
  const variant = pickedVariant(pick);
  const pvid = variant?.product_variation_id ?? variant?.id;
  if (pvid) {
    const line = localCart.find((s) => s.product_variation_id === pvid || s.id === pvid || s.variation_id === pvid);
    if (line) return line;
  }
  if (exact) return localCart?.find((s) => s.id === id);
  return undefined;
}

/** The seller's limit and a running flash deal's limit both cap the quantity; the lower wins. */
function reachedMax(pick: BuyPick): boolean {
  const line = bagLineOf(pick);
  if (!line) return false;
  const limits = [Number(pick.product?.max_allowed_qty), Number(pick.product?.flash_deal_max_allowed_quantity)].filter(
    (limit) => Number.isFinite(limit) && limit > 0,
  );
  if (limits.length === 0) return false;
  return line.quantity >= Math.min(...limits);
}

/** The colour and the size, as the old events write them. */
function pickFields(pick: BuyPick) {
  const row = colorRowOf(pick.product, pick.colorKeys);
  return {
    selected_color: row?.color_option ?? row?.color_name ?? null,
    selected_size: pick.size,
  };
}

/** The product's fields every old event sends. */
function productFields(product: any) {
  return {
    item_name: product?.name,
    brand: product?.brand?.name,
    brand_id: product?.brand?.id,
    category: product?.categories?.[0]?.name,
    category_id: product?.categories?.[0]?.id,
  };
}

/** The sheet opened: the denominator of the add-to-cart funnel. */
export function buyOpened(product: any) {
  trackOrder(ORDER_EVENTS.ADD_TO_CART_WIDGET_OPENED, {
    product_id: product?.product_id ?? product?.id,
    item_name: product?.name,
    brand: product?.brand?.name,
    category: product?.categories?.[0]?.name,
    is_luck: Boolean(product?.is_luck),
    is_flash_deal: Boolean(product?.flash_deal_end_date || product?.flash_deal_details),
    source: DetectScreen(),
  });
}

/** A size was picked (the old sheet's `CHANGE_SIZE`). */
export function sizePicked(pick: BuyPick) {
  GAevent({
    action: GA_EVENT_NAMES.CHANGE_SIZE,
    params: {
      user_id_custom: auth.UserID(),
      item_id: pick.product?.id,
      ...productFields(pick.product),
      price: pick.product?.offer_price,
      ...pickFields(pick),
    },
  });
}

/** The old `add_to_cart` event's fields. */
function addToCartProps(pick: BuyPick, quantity: number, variantId: any) {
  const { product } = pick;
  const variant = pickedVariant(pick);
  const luckActive = isLuckActive(product, product?.id);
  const offer = luckActive ? variant?.luck_price : variant?.offer_price;
  const original = product?.price ?? variant?.price;
  return {
    product_id: product?.id,
    item_name: product?.name,
    brand: product?.brand?.name,
    brand_id: product?.brand?.id,
    category: product?.categories?.[0]?.name,
    category_id: product?.categories?.[0]?.id,
    variant: variantId,
    quantity,
    price: offer,
    original_price: original,
    has_discount: typeof original === "number" && typeof offer === "number" && original > offer,
    is_flash_deal: Boolean(product?.flash_deal_end_date || product?.flash_deal_details),
    is_luck: luckActive,
    color_changed: Boolean(pick.colorChanged),
    size_changed: Boolean(pick.sizeChanged),
    ...pickFields(pick),
    source: DetectScreen(),
  };
}

/** The GA `add_to_cart` event, as the old sheet sent it. */
function gaAddToCart(pick: BuyPick, quantity: number, variantId: any) {
  const { product } = pick;
  const { currency } = useAppStore.getState();
  const variant = pickedVariant(pick);
  GAevent({
    action: GA_EVENT_NAMES.ADD_TO_CART,
    params: {
      currency: currency?.code,
      value: variant?.offer_price,
      items: [
        {
          item_id: product?.id,
          item_name: product?.name,
          price: variant?.offer_price,
          quantity,
          brand: product?.brand?.name,
          brand_id: product?.brand?.id,
          category: product?.categories?.[0]?.name,
          category_id: product?.categories?.[0]?.id,
          count_likes: product?.count_of_likes,
          item_variant: variantId,
        },
      ],
      interaction_type: "add_to_cart",
      user_id_custom: auth.UserID(),
      screen_name: DetectScreen(),
      screen_path: window.location.pathname,
    },
  });
}

/**
 * One piece into the bag: one more of a line already there (`/cart/update`),
 * else a new line (`/cart/add`). Then the bag is read again. A new line whose
 * price is not the one the bar showed comes back as `priceChange`.
 */
export async function addOne(pick: BuyPick): Promise<{ ok: boolean; priceChange?: PriceChange }> {
  const { product } = pick;
  const id = product?.id;
  const variant = pickedVariant(pick);
  const hasVariants = (product?.variation?.length ?? 0) > 0;
  const variantId = hasVariants ? variantIdOf(variant) : null;
  // The tap, before the checks (the old `add_to_cart_buy_clicked`).
  trackOrder(ORDER_EVENTS.ADD_TO_CART_BUY_CLICKED, {
    product_id: id,
    item_name: product?.name,
    brand: product?.brand?.name,
    category: product?.categories?.[0]?.name,
    variant: variantIdOf(variant),
    ...pickFields(pick),
    is_valid: true,
    reached_max: reachedMax(pick),
    already_in_cart: Boolean(bagLineOf(pick)),
    is_luck: isLuckActive(product, id),
    source: DetectScreen(),
  });
  if (reachedMax(pick)) {
    showErrorNotification(translateFunction("Max Allowed Quantity Reached"));
    return { ok: false };
  }
  try {
    const line = bagLineOf(pick);
    // Read the luck flag at the tap, not when the sheet opened (A2-14).
    const luckNow = isLuckActive(product, id);
    if (line) {
      const qty = (line?.quantity ?? 0) + 1;
      const done = await cart.UpdateCart({
        cart_id: line?.item_id,
        qty,
        isFromAddWidget: true,
        is_luck: luckNow,
        showed_price: resolveShowedPrice({
          product,
          selectedVariant: variant,
          cartItem: line,
          bagLine: findBagLine(useAppStore.getState().cart, line),
          isLuck: luckNow,
        }),
      });
      if (done === false) throw new Error("the core backend did not take the new quantity");
      // A line keeps the price it was added at: no price change to ask about.
      await getCart({ callback: () => {} });
      gaAddToCart(pick, qty, variantId);
      trackOrder(ORDER_EVENTS.ADD_TO_CART, addToCartProps(pick, qty, variantId));
      return { ok: true };
    }
    const row = colorRowOf(product, pick.colorKeys);
    const added = await cart.AddToCart({
      product_id: id,
      product_variation_id: variantId,
      color: product?.colors?.find(
        (s) =>
          s.option === row?.color_option ||
          s.name === row?.color_option ||
          s.option === row?.color_name ||
          s.name === row?.color_name ||
          s.color_option === row?.color_option ||
          s.color_option === row?.color_name,
      )?.color,
      type: variantId,
      choice_1: pick.size,
      qty: 1,
      image: row?.images?.[0]?.file_path || row?.images?.[0] || product?.images?.[0]?.file_path || product?.images?.[0],
      isFromAddWidget: true,
      is_luck: luckNow,
      offer_price: luckNow ? variant?.luck_price : variant?.offer_price,
      showed_price: resolveShowedPrice({ product, selectedVariant: variant, isLuck: luckNow }),
    });
    if (luckNow) useAppStore.getState().expireLuck(id);
    if (!added) throw new Error("the core backend did not add the item");
    // AddToCart puts the new line, with its cart id, at the end of the bag.
    const itemId = useAppStore.getState().localCart.findLast((s) => s.id === id)?.item_id;
    gaAddToCart(pick, 1, variantId);
    trackOrder(ORDER_EVENTS.ADD_TO_CART, addToCartProps(pick, 1, variantId));
    const bag = await getCart({ callback: () => {} });
    const fresh = (bag as any)?.cart?.find((s) => s?.id === itemId);
    const change = fresh ? showedPriceChange(fresh) : null;
    return { ok: true, priceChange: change && itemId != null ? { itemId, ...change } : undefined };
  } catch (error) {
    LogError({
      error,
      scenario: "add to bag from the buy bar - AppProductBuy",
      slug: product?.slug,
      url: window.location.href,
      variant: bagLineOf(pick),
    });
    return { ok: false };
  }
}

/** One piece out of the bag: one less of the line, or the line out on its last piece. */
export async function takeOne(pick: BuyPick): Promise<boolean> {
  const { product } = pick;
  const variant = pickedVariant(pick);
  const line = bagLineOf(pick, true);
  try {
    if (line?.quantity > 1) {
      const done = await cart.UpdateCart({
        cart_id: line?.item_id,
        qty: line?.quantity - 1,
        isFromAddWidget: true,
        showed_price: resolveShowedPrice({
          product,
          selectedVariant: variant,
          cartItem: line,
          bagLine: findBagLine(useAppStore.getState().cart, line),
          isLuck: isLuckActive(product, product?.id),
        }),
      });
      if (done === false) throw new Error("the core backend did not take the new quantity");
      await getCart({ callback: () => {} });
      return true;
    }
    if (line?.quantity === 1) {
      const removed = await cart.RemoveFromCart({ cart_item: line, isFromAddWidget: true });
      // A refusal is not a removal: no event, and the bar keeps the item.
      if (removed === false) throw new Error("the core backend did not remove the item");
      GAevent({
        action: GA_EVENT_NAMES.REMOVE_FROM_CART,
        params: {
          items: [
            {
              item_id: product.id,
              item_name: product.name,
              item_variant: variantIdOf(variant),
              quantity: 1,
              price: variant?.offer_price,
            },
          ],
        },
      });
      trackOrder(ORDER_EVENTS.CART_ITEM_REMOVED, {
        product_id: product?.id,
        item_name: product?.name,
        variant: variantIdOf(variant),
        qty: 1,
        unit_price: variant?.offer_price,
        source: DetectScreen(),
      });
      await getCart({ callback: () => {} });
      return true;
    }
    return false;
  } catch (error) {
    LogError({
      error,
      scenario: "take one out of the bag from the buy bar - AppProductBuy",
      slug: product?.slug,
      url: window.location.href,
      variant,
    });
    return false;
  }
}

/** The shopper does not want the line whose price changed: the whole line leaves. */
export async function removeChangedLine(change: PriceChange, product: any): Promise<boolean> {
  const line = useAppStore.getState().localCart.find((s) => s.item_id === change.itemId);
  const removed = await cart.RemoveFromCart({
    cart_item: line ?? { item_id: change.itemId },
    isFromAddWidget: true,
  });
  if (removed === false) {
    showErrorNotification(translateFunction("Something went wrong"));
    return false;
  }
  trackOrder(ORDER_EVENTS.CART_ITEM_REMOVED, {
    product_id: product?.id,
    item_name: product?.name,
    variant: line?.product_variation_id,
    qty: line?.quantity,
    unit_price: change.to,
    reason: "price_changed",
    source: DetectScreen(),
  });
  await getCart({ callback: () => {} });
  return true;
}

/**
 * Ask to be told when the picked variant is back. True when the backend took
 * it. A size already asked for gets the old message: there is no way to undo
 * it yet.
 */
export async function notifyMe(pick: BuyPick): Promise<boolean> {
  const { product } = pick;
  const variant = pickedVariant(pick);
  if (variant?.variant_notify_for_user) {
    showSuccessNotification(translateFunction("You will be notified for this product already"), 5000);
    return false;
  }
  try {
    await home.AllowNotifications();
    GAevent({
      action: GA_EVENT_NAMES.ENABLE_PRODUCT_NOTIFICATION,
      params: {
        user_id_custom: auth.UserID(),
        item_id: product.id,
        type_notification: "product_availablity",
        ...productFields(product),
        category: product?.category?.name || product?.categories?.[0]?.name,
        category_id: product?.category?.id || product?.categories?.[0]?.id,
        price: product?.offer_price,
      },
    });
    const answer: any = await auth.NotifyForProducts({ id: product?.id, variant: variantIdOf(variant) });
    if (answer?.success === false) throw new Error(answer?.message || "the notify request was refused");
    await home.GetFireBaseSettings();
    return true;
  } catch (error: any) {
    LogError({
      error,
      scenario: "notify me from the buy bar - AppProductBuy",
      slug: product?.slug,
      url: window.location.href,
    });
    const message =
      error?.message ?? translateFunction("Notification Is Not Enabled! please Allow Notification Access");
    showErrorNotification(message);
    showErrorMessage(message);
    return false;
  }
}

/** The product's prices and stock again (`qtyPriceDetails`), on the old sheet's rules. */
export async function readStock(slug: string, product: any): Promise<any> {
  const response = await fetchData({
    method: "GET",
    server: "market",
    url: `/web/product/qtyPriceDetails/${slug}?need_decode=true`,
    reqTitle: REQUESTS_DATA.GET_PRODUCT_VARIANTS,
  });
  if (!response?.data) return product;
  return {
    ...product,
    ...response.data,
    // The luck price has no place in the design (A-33): it is not offered.
    is_luck: false,
    variation: (response.data.variations ?? product?.variation ?? []).map((variant) => ({
      ...variant,
      variant_notify_for_user: product?.variation?.find(
        (s) => (s.product_variation_id ?? s.id) === (variant.product_variation_id ?? variant.id),
      )?.variant_notify_for_user,
    })),
  };
}

/** The stock on the page after an add (-1) or a take (+1), as the old sheet kept it. */
export function withStock(product: any, pick: BuyPick, delta: number): any {
  if (product?.packed_after_ordering === 1) return product;
  const variant = pickedVariant(pick);
  const id = variant?.product_variation_id ?? variant?.id;
  return {
    ...product,
    variation: product?.variation?.map((s) =>
      (s.product_variation_id ?? s.id) === id ? { ...s, qty: Math.max(0, (Number(s.qty) || 0) + delta) } : s,
    ),
    available_quantity: Math.max(0, (Number(product?.available_quantity) || 0) + delta),
  };
}

/** The shopper asked to be told about the picked variant: the page shows it at once. */
export function withNotified(product: any, pick: BuyPick): any {
  if (!product?.variation?.length) return { ...product, is_product_notify_for_user: true };
  const variant = pickedVariant(pick);
  const id = variant?.product_variation_id ?? variant?.id;
  return {
    ...product,
    variation: product.variation.map((s) =>
      (s.product_variation_id ?? s.id) === id ? { ...s, variant_notify_for_user: true } : s,
    ),
  };
}
