import { useAppStore } from "store";
import cartService from "services/cart";
import auth from "services/auth";
import order from "services/order";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import {
  getCart,
  getOldCart,
  GetCartOreview,
  LogError,
  translateFunction,
} from "utils/functions";
import { GA_EVENT_NAMES, GA_GLOBAL_SCREEN } from "utils/GAEvents";
import { GAevent } from "utils/gtag";
import { ORDER_EVENTS, endOrderAttempt, startOrderAttempt, trackOrder } from "utils/orderFunnel";
import { cartLineUnitPrice } from "utils/cart/pricing";
import { showErrorNotification } from "@/store/notifications/reducer";

/*
  What the bag does, for the new bag screen (Stage 7d, AppCart).

  Each action is the old bag's own logic (components/Cart/index.tsx,
  OldCartContainer.tsx, CartPage.tsx), with the same requests, the same store
  writes and the same analytics events (D-10). Only the drawing is new.
*/

/** Fills the store with the cart again (the old bag's `getCart` + `initCart`). */
async function reloadCart() {
  const { initCart } = useAppStore.getState();
  await getCart({
    callback: ([data]) => {
      initCart(data ?? { cart: [] });
    },
  });
}

/**
 * The bag screen opened: the old bag's first load. It sends the screen view,
 * resets the order step, reads the cart and the old cart (Out of Bag), and
 * sends `view_cart` and the funnel's cart view when the cart has items.
 */
export async function openBag() {
  const { setCartLoading, setOrderData, initCart } = useAppStore.getState();
  GAevent({
    action: GA_EVENT_NAMES.SCREEN_VIEW,
    params: {
      screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,
      screen_path: window.location.pathname,
    },
  });
  setCartLoading(true);
  setOrderData({
    payment: [],
    coupon: false,
    coupon_number: "",
    loading: false,
    success: false,
    data: [],
    receipt_number: null,
  });
  void getOldCart();
  const data = await getCart({
    callback: ([data]) => {
      initCart(data ?? { cart: [] });
    },
  });
  setCartLoading(false);
  if (data?.cart?.length > 0) {
    GAevent({
      action: GA_EVENT_NAMES.VIEW_CART,
      params: {
        items: data.cart.map((item) => ({
          item_id: item.product_id,
          item_name: item.name,
          price: item.offer_price,
          quantity: item.quantity,
          item_variant: item.product_variation_id ?? "N/A",
        })),
        screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,
        screen_path: window.location.pathname,
      },
    });
    trackOrder(ORDER_EVENTS.CART_VIEWED, {
      item_count: data.cart.length,
    });
  }
}

/** The cart could not be read: try again (the old bag's retry). */
export async function retryBag() {
  const { setCartLoading } = useAppStore.getState();
  setCartLoading(true);
  await reloadCart();
  setCartLoading(false);
}

/**
 * How many of a line the shopper may hold, or null for no cap. The lowest of
 * the seller's per-order limit, the flash deal's limit and the stock left
 * (the old bag's `quantityCap`). A field the backend did not send is no cap.
 */
export function quantityCap(line: any): number | null {
  const caps: number[] = [];
  const perOrderLimit = Number(line?.max_allowed_qty);
  if (Number.isFinite(perOrderLimit) && perOrderLimit > 0)
    caps.push(perOrderLimit);
  const flashDealLimit = Number(
    line?.flash_deal_details?.flash_deal_max_allowed_quantity,
  );
  if (Number.isFinite(flashDealLimit) && flashDealLimit > 0)
    caps.push(flashDealLimit);
  const max = line?.available_quantity;
  const stockLeft = Number(max);
  if (max !== null && max !== undefined && Number.isFinite(stockLeft) && stockLeft >= 0)
    caps.push(stockLeft);
  return caps.length > 0 ? Math.min(...caps) : null;
}

/** One piece's price on this line, as the shopper sees it (the luck price, the offer, or the price). */
const unitPriceOf = (line: any) => Number(cartLineUnitPrice(line));

/**
 * One more of a line. At the cap it says so and sends nothing. When the core
 * backend refuses the raise on stock, `onRefused` runs (the bag then offers
 * "Notify Me", as the old bag did).
 */
export async function raiseLine(line: any, onRefused: () => void) {
  const qty = Number(line?.quantity) || 0;
  const cap = quantityCap(line);
  if (cap !== null && qty >= cap) {
    showErrorNotification(translateFunction("Max Allowed Quantity Reached"));
    return;
  }
  const { currency } = useAppStore.getState();
  trackOrder(ORDER_EVENTS.CART_ITEM_QTY_INCREASED, {
    product_id: line?.product_id ?? line?.id,
    item_name: line?.name,
    variant: line?.variant,
    from_qty: qty,
    to_qty: qty + 1,
    unit_price: unitPriceOf(line),
  });
  GAevent({
    action: GA_EVENT_NAMES.ADD_TO_CART,
    params: {
      currency: currency?.code,
      value: line?.offer_price,
      items: [
        {
          item_id: line?.product_id,
          item_name: line?.name,
          price: line?.offer_price,
          quantity: qty + 1,
          brand: line?.brand?.name,
          category: line?.category_name,
          item_variant: line?.variant,
        },
      ],
      user_id_custom: auth.UserID(),
      interaction_type: "add_to_cart",
      screen_name: GA_GLOBAL_SCREEN.CART_SCREEN,
      screen_path: window.location.pathname,
    },
  });
  await changeQty(line, qty + 1, qty, onRefused);
}

/** One less of a line. The last one takes the line out (removeLine). */
export async function lowerLine(line: any) {
  const qty = Number(line?.quantity) || 0;
  if (qty <= 1) {
    await removeLine(line);
    return;
  }
  trackOrder(ORDER_EVENTS.CART_ITEM_QTY_DECREASED, {
    product_id: line?.product_id ?? line?.id,
    item_name: line?.name,
    variant: line?.variant,
    from_qty: qty,
    to_qty: qty - 1,
    unit_price: unitPriceOf(line),
  });
  await changeQty(line, qty - 1, qty, () => {});
}

/** The old bag's `updateQuantity`, then a fresh cart. */
async function changeQty(line: any, qty: number, before: number, onRefused: () => void) {
  const succeeded = await cartService.UpdateCart({
    cart_id: line?.id,
    qty,
    // The price of ONE piece the row shows; the core backend saves it.
    showed_price: unitPriceOf(line),
    // Only a raise can run out of stock: a refused lower says nothing.
    onRefused: () => {
      if (qty > before) onRefused();
    },
  });
  if (!succeeded) {
    LogError({
      error: new Error("Cart quantity update rejected"),
      scenario: "Update Qty For Cart Item bag screen",
      id: line?.id,
      quantity: qty,
    });
  }
  await reloadCart();
}

/** Takes a line out of the bag (the old bag's delete, with `remove_from_cart`). */
export async function removeLine(line: any) {
  const { removeFromCart } = useAppStore.getState();
  GAevent({
    action: GA_EVENT_NAMES.REMOVE_FROM_CART,
    params: {
      items: [
        {
          item_id: line?.product_id,
          item_name: line?.name,
          item_variant: line?.variant,
          quantity: 1,
          price: line?.offer_price,
        },
      ],
    },
  });
  removeFromCart(line?.id);
  await cartService.RemoveFromCart({
    cart_item: { ...line, item_id: line?.id },
  });
  await GetCartOreview();
}

/** An Out of Bag item goes back into the bag (the old cart's "Add Again?"). */
export async function addOldLineAgain(line: any) {
  try {
    const succeeded = await cartService.AddToCart({
      product_id: line?.product_id ?? line?.id,
      color: line?.variations?.color,
      choice_1: line?.variations?.Size,
      product_variation_id: line?.product_variation_id ?? null,
      qty: parseInt(line?.quantity) || 1,
      image: line?.image,
      offer_price: line?.offer_price,
      showed_price: line?.offer_price ?? line?.price,
      type: line?.product_variation_id,
    });
    if (!succeeded) return;
    trackOrder(ORDER_EVENTS.OLD_CART_ITEM_RE_ADDED, {
      product_id: line?.product_id ?? line?.id,
      item_name: line?.name,
    });
    await reloadCart();
    await getOldCart();
  } catch (error) {
    LogError({
      error,
      scenario: "Add Again from Out-Of-Bag bag screen",
      id: line?.id,
    });
  }
}

/**
 * "Confirm & continue": the old bag's move to the checkout, with its events
 * (the checkout screen view, `begin_checkout`, and the funnel's attempt id
 * minted before the funnel's begin checkout).
 */
export function beginCheckout() {
  const { cart, total_cash } = useAppStore.getState();
  GAevent({
    action: GA_EVENT_NAMES.SCREEN_VIEW,
    params: {
      screen_name: GA_GLOBAL_SCREEN.CHECKOUT_SCREEN,
      screen_path: window.location.pathname,
    },
  });
  GAevent({
    action: GA_EVENT_NAMES.BEGIN_CHECKOUT,
    params: {
      value: total_cash,
      items: cart.map((item) => ({
        item_id: item.product_id,
        item_name: item.name,
        price: item.offer_price,
        quantity: item.quantity,
        item_variant: item.variant ?? "N/A",
      })),
    },
  });
  startOrderAttempt();
  trackOrder(ORDER_EVENTS.BEGIN_CHECKOUT, {
    value: total_cash,
    item_count: cart.length,
  });
}

/**
 * The terms row: agree or take it back (the old checkout's `setAgree`). An
 * agreement is sent to the core backend first (`/customer/approve-policies`);
 * a failed send is logged and the agreement still counts, as before.
 */
export async function agreeToTerms(agree: boolean) {
  const { setOrderData } = useAppStore.getState();
  if (agree) {
    try {
      await fetchData({
        url: "/customer/approve-policies",
        server: "market",
        method: "GET",
        reqTitle: REQUESTS_DATA.APPROVE_POLICY,
        noMessage: true,
      });
    } catch (error) {
      LogError({
        error,
        scenario: "error in agree to policy - setAgree - checkout screen",
      });
    }
  }
  setOrderData({ agree });
  trackOrder(ORDER_EVENTS.TERMS_AGREED_TOGGLED, { agreed: !!agree });
}

/** How placing the order ended, so the checkout knows where to go. */
export type PlaceOutcome =
  | "done"
  /** The phone is not verified: the login screens first (A-27). */
  | "verify"
  /** The cart is empty, or a line cannot be bought: back to the bag. */
  | "bag"
  /** The core backend refused (a message is on show) or the rdb lock is on. */
  | "failed";

/** The Trydos wallet: payment id 4, placed with the same call as cash (the old checkout's `setOrderSuccess`). */
const WALLET_PAYMENT = { id: 4, name: "trydos_wallet" } as const;

/**
 * "Checkout / Complete" with the wallet: the old checkout's checks
 * (`VerifyCart`), then the order (`order.PlaceOrder`, `trydos_wallet`). The
 * core backend checks the wallet's balance itself.
 */
export async function placeWalletOrder(): Promise<PlaceOutcome> {
  const { setOrderData } = useAppStore.getState();
  trackOrder(ORDER_EVENTS.PLACE_ORDER_CLICKED, { has_rdb_payment: false });
  try {
    const lines = (
      await getCart({
        callback: ([data]) => {
          useAppStore.getState().initCart(data ?? { cart: [] });
        },
      })
    ).cart;
    if (useAppStore.getState().userProfile?.is_phone_verified === 0) {
      trackOrder(ORDER_EVENTS.PLACE_ORDER_BLOCKED_PHONE_UNVERIFIED);
      return "verify";
    }
    if (!lines || lines.length === 0) {
      trackOrder(ORDER_EVENTS.PLACE_ORDER_EMPTY_CART);
      return "bag";
    }
    const blocked = lines.some(
      (line: any) =>
        line?.check_availability === false ||
        line?.is_country_restricted === true ||
        line?.is_active === false,
    );
    if (blocked) throw new Error("Please Review Your Cart Info");
  } catch (error) {
    LogError({
      error,
      scenario: "check availabilty for creating order - checkout screen",
    });
    showErrorNotification(
      translateFunction("Please Review Your Cart Some Products Not Available"),
    );
    trackOrder(ORDER_EVENTS.PLACE_ORDER_BLOCKED_CART_UNAVAILABLE, {
      reason: error instanceof Error ? error.message : String(error),
    });
    return "bag";
  }
  setOrderData({ payment: [WALLET_PAYMENT], loading: true });
  trackOrder(ORDER_EVENTS.ORDER_SUBMIT_ATTEMPT, { payment_method: WALLET_PAYMENT.name });
  await order.PlaceOrder({ payment_method: WALLET_PAYMENT.name });
  setOrderData({ loading: false });
  if (useAppStore.getState().orderData?.success) return "done";
  // PlaceOrder logged the refusal; show the core backend's words.
  await reloadCart();
  return "failed";
}

/**
 * The purchase done screen opened after a placed order: the old success
 * screen's events (its screen view, `purchase`, the coupon events when a
 * coupon was used, the funnel's order completed), then the funnel's attempt
 * ends.
 */
export function orderDoneEvents() {
  const { orderData, currency, total_shipping_cost, cart } = useAppStore.getState();
  if (!orderData?.success) return;
  const rows: any[] = Array.isArray(orderData.data) ? orderData.data : [];
  const value = rows.reduce((sum, row) => sum + (Number(row?.order_amount) || 0), 0);
  const transaction = rows[0]?.order_group_id;
  GAevent({
    action: GA_EVENT_NAMES.SCREEN_VIEW,
    params: {
      screen_name: GA_GLOBAL_SCREEN.ORDER_SUCCESS_SCREEN,
      screen_path: window.location.pathname,
    },
  });
  GAevent({
    action: GA_EVENT_NAMES.PURCHASE,
    params: {
      transaction_id: transaction,
      value,
      currency: currency?.code,
      shipping: total_shipping_cost,
      coupon_code: orderData.coupon_number,
      coupon_id: orderData.coupon_number,
      coupon_discount_rate: orderData.coupon,
      items: cart.map((item) => ({
        item_id: item.product_id,
        item_name: item.name,
        quantity: item.quantity,
        price: item.offer_price,
        brand: item.brand?.name ?? "N/A",
        brand_id: item.brand?.id ?? "N/A",
        category: item?.category_name ?? "N/A",
        category_id: item?.category?.id ?? "N/A",
        item_variant: item.variant ?? "N/A",
      })),
      user_id_custom: auth.UserID(),
      interaction_type: "purchase",
      screen_name: GA_GLOBAL_SCREEN.ORDER_SUCCESS_SCREEN,
      screen_path: window.location.pathname,
    },
  });
  if (orderData?.coupon_number?.length > 0) {
    GAevent({
      action: GA_EVENT_NAMES.COUPON_USED,
      params: {
        user_id_custom: auth.UserID(),
        coupon_id: orderData.coupon_number,
        coupon_code: orderData.coupon_number,
        coupon_discount_rate: orderData.coupon,
        transaction_id: transaction,
      },
    });
    trackOrder(ORDER_EVENTS.COUPON_USED, {
      coupon_code: orderData.coupon_number,
      coupon_discount_rate: orderData.coupon,
      transaction_id: transaction,
    });
  }
  // Funnel end: before the attempt id is cleared, so it carries the id.
  trackOrder(ORDER_EVENTS.ORDER_COMPLETED, {
    transaction_id: transaction,
    value,
    shipping: total_shipping_cost,
    coupon_code: orderData.coupon_number,
  });
  endOrderAttempt();
}
