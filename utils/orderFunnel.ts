// Create-order funnel instrumentation — PostHog ONLY.
//
// Every event in the add-to-cart → place-order journey is emitted through
// `trackOrder`, which fans to PostHog via `posthogCapture` (no GA, no backend).
// Routing is intentionally PostHog-only: these are product-funnel + drop-off
// diagnostics, kept out of the GA event stream.
//
// Correlation: `startOrderAttempt()` mints an `order_attempt_id` at
// `begin_checkout` and stashes it on `orderData` (the store merges partials).
// `trackOrder` then auto-attaches it to every later event, so one checkout
// attempt — including retries and abandons — is traceable end-to-end. Call
// `endOrderAttempt()` once the order completes.
//
// All wrappers are no-ops off the client / outside production (posthogCapture
// early-returns), and never throw — analytics must not break checkout.
import { useAppStore } from "store";
import { posthogCapture } from "./posthog";
import { DetectScreen } from "./tinyUtils";
import auth from "services/auth";

// Canonical event names. Snake_case, PostHog-friendly. Grouped by stage.
export const ORDER_EVENTS = {
  // --- Cart edit ---
  ADD_TO_CART_WIDGET_OPENED: "add_to_cart_widget_opened",
  ADD_TO_CART_BUY_CLICKED: "add_to_cart_buy_clicked",
  ADD_TO_CART: "order_add_to_cart",
  CART_ITEM_QTY_INCREASED: "cart_item_qty_increased",
  CART_ITEM_QTY_DECREASED: "cart_item_qty_decreased",
  CART_ITEM_REMOVED: "cart_item_removed",
  CART_ITEM_MOVED_TO_OLD: "cart_item_moved_to_old",
  OLD_CART_ITEM_REMOVED: "old_cart_item_removed",
  OLD_CART_CLEARED: "old_cart_cleared",
  CART_VIEWED: "order_cart_viewed",

  // --- Discount / coupon ---
  COUPON_APPLY_ATTEMPT: "coupon_apply_attempt",
  COUPON_APPLY_SUCCEEDED: "coupon_apply_succeeded",
  COUPON_APPLY_FAILED: "coupon_apply_failed",
  DISCOUNT_TOTALS_SHOWN: "discount_totals_shown",

  // --- Checkout entry ---
  BEGIN_CHECKOUT: "order_begin_checkout",
  CHECKOUT_ADDRESS_SCREEN_VIEWED: "checkout_address_screen_viewed",

  // --- Address ---
  ADDRESS_LIST_OPENED: "address_list_opened",
  ADDRESS_ADD_STARTED: "address_add_started",
  ADDRESS_SAVED: "address_saved",
  ADDRESS_SAVE_FAILED: "address_save_failed",
  ADDRESS_SELECTED: "address_selected",
  ADDRESS_DELETED: "address_deleted",

  // --- Payment method ---
  PAYMENT_METHOD_SELECTED: "payment_method_selected",

  // --- Confirm shipping + payment (step 1.0 -> 1.1) ---
  CHECKOUT_CONFIRM_CLICKED: "checkout_confirm_clicked",
  CHECKOUT_BLOCKED_ADDRESS_MISSING: "checkout_blocked_address_missing",
  CHECKOUT_BLOCKED_PAYMENT_MISSING: "checkout_blocked_payment_missing",
  CHECKOUT_BLOCKED_BALANCE_INSUFFICIENT: "checkout_blocked_balance_insufficient",
  CHECKOUT_BLOCKED_PHONE_UNVERIFIED: "checkout_blocked_phone_unverified",
  CHECKOUT_BLOCKED_CART_UNAVAILABLE: "checkout_blocked_cart_unavailable",
  CHECKOUT_EMPTY_CART: "checkout_empty_cart",

  // --- Verify-number sub-flow (flow_source: "checkout") ---
  VERIFY_FLOW_OPENED: "verify_flow_opened",
  VERIFY_OTP_FAILED: "verify_otp_failed",
  VERIFY_COMPLETED_RETURNED_TO_CHECKOUT: "verify_completed_returned_to_checkout",

  // --- Place order (final) ---
  TERMS_AGREED_TOGGLED: "terms_agreed_toggled",
  PLACE_ORDER_CLICKED: "place_order_clicked",
  PLACE_ORDER_BLOCKED_TERMS_NOT_AGREED: "place_order_blocked_terms_not_agreed",
  PLACE_ORDER_BLOCKED_PHONE_UNVERIFIED: "place_order_blocked_phone_unverified",
  PLACE_ORDER_BLOCKED_CART_UNAVAILABLE: "place_order_blocked_cart_unavailable",
  PLACE_ORDER_EMPTY_CART: "place_order_empty_cart",

  // --- Payment execution (COD / crypto / card) ---
  ORDER_SUBMIT_ATTEMPT: "order_submit_attempt",
  PAYMENT_REDIRECT_OPENED: "payment_redirect_opened",
  ORDER_PLACE_FAILED: "order_place_failed",

  // --- Payment execution (wallet) ---
  WALLET_MODAL_OPENED: "wallet_modal_opened",
  WALLET_PAYMENT_ATTEMPT: "wallet_payment_attempt",
  WALLET_PAYMENT_BLOCKED_INSUFFICIENT: "wallet_payment_blocked_insufficient",
  WALLET_PAYMENT_PROCESSING: "wallet_payment_processing",
  WALLET_PAYMENT_SUCCEEDED: "wallet_payment_succeeded",
  WALLET_PAYMENT_TIMEOUT: "wallet_payment_timeout",
  WALLET_PAYMENT_FAILED: "wallet_payment_failed",
  WALLET_CURRENCY_CHANGED: "wallet_currency_changed",
  WALLET_DATA_LOAD_FAILED: "wallet_data_load_failed",
  WALLET_BALANCE_REFRESHED: "wallet_balance_refreshed",

  // --- Completion ---
  ORDER_COMPLETED: "order_completed",
  COUPON_USED: "order_coupon_used",
  ORDER_SUCCESS_DONE_CLICKED: "order_success_done_clicked",
} as const;

export type OrderEvent = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];

const newId = (): string => {
  try {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      return crypto.randomUUID();
    }
  } catch {
    /* fall through */
  }
  return `oa_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
};

// Mint a correlation id for one checkout attempt and stash it on orderData.
export const startOrderAttempt = (): string => {
  const id = newId();
  try {
    useAppStore.getState().setOrderData?.({ attempt_id: id });
  } catch {
    /* ignore */
  }
  return id;
};

export const getOrderAttemptId = (): string | undefined => {
  try {
    return (useAppStore.getState().orderData as any)?.attempt_id;
  } catch {
    return undefined;
  }
};

export const endOrderAttempt = () => {
  try {
    useAppStore.getState().setOrderData?.({ attempt_id: undefined });
  } catch {
    /* ignore */
  }
};

// Base props attached to every funnel event so each one is self-describing in
// PostHog (segment / break down without joins).
const baseProps = (): Record<string, unknown> => {
  if (typeof window === "undefined") return {};
  try {
    const s = useAppStore.getState();
    const cart = (s.cart as any[]) ?? [];
    return {
      order_attempt_id: (s.orderData as any)?.attempt_id,
      screen: DetectScreen(),
      currency: (s.currency as any)?.code,
      item_count: cart.length,
      cart_value: (s as any).total_cash ?? (s as any).total,
      is_phone_verified: (s.userProfile as any)?.is_phone_verified,
      user_id: auth.UserID?.(),
    };
  } catch {
    return {};
  }
};

// The single entry point. Merge base props, let explicit props win.
export const trackOrder = (
  event: OrderEvent,
  props: Record<string, unknown> = {},
) => {
  posthogCapture(event, { ...baseProps(), ...props });
};

// ---------------------------------------------------------------------------
// Post-purchase order management (history / details / cancel / return / rate)
//
// These fire on screens where the checkout is already finished, so the cart /
// total / order_attempt_id that `baseProps()` reads are empty and meaningless.
// They go through their own `trackOrderMgmt` wrapper with a cart-free base set.
// ---------------------------------------------------------------------------
export const ORDER_MGMT_EVENTS = {
  // --- Browse past orders ---
  ORDER_HISTORY_VIEWED: "order_history_viewed",
  ORDER_HISTORY_FILTERED: "order_history_filtered",
  ORDER_DETAILS_VIEWED: "order_details_viewed",

  // --- Modify a placed order ---
  ORDER_ITEM_CHANGE_REQUESTED: "order_item_change_requested",
  ORDER_ADDRESS_CHANGED: "order_address_changed",

  // --- Cancel / return / rate / report ---
  ORDER_CANCELLED: "order_cancelled",
  ORDER_ITEM_CANCELLED: "order_item_cancelled",
  ORDER_RETURN_REQUESTED: "order_return_requested",
  ORDER_ITEM_RATED: "order_item_rated",
  ORDER_ITEM_REPORTED: "order_item_reported",

  // --- Option-sheet entry points + list hygiene (denominators / lower priority) ---
  ORDER_OPTIONS_OPENED: "order_options_opened",
  ORDER_ITEM_OPTIONS_OPENED: "order_item_options_opened",
  ORDER_PACK_HIDDEN: "order_pack_hidden",
  ORDER_ITEM_HIDDEN: "order_item_hidden",
} as const;

export type OrderMgmtEvent =
  (typeof ORDER_MGMT_EVENTS)[keyof typeof ORDER_MGMT_EVENTS];

// Cart-free base props for the order-management screens. Keep it to the
// dimensions that are actually available post-purchase.
const mgmtBaseProps = (): Record<string, unknown> => {
  if (typeof window === "undefined") return {};
  try {
    const s = useAppStore.getState();
    return {
      screen: DetectScreen(),
      currency: (s.currency as any)?.code,
      user_id: auth.UserID?.(),
    };
  } catch {
    return {};
  }
};

export const trackOrderMgmt = (
  event: OrderMgmtEvent,
  props: Record<string, unknown> = {},
) => {
  posthogCapture(event, { ...mgmtBaseProps(), ...props });
};

// Resolve the `flow_source` for the verify-number sub-flow from the auth store's
// `shouldAuthinticated` marker. String markers identify their origin
// ("open Story", "open chat", "seller"); the bare boolean `true` is the generic
// "must verify to proceed" gate used by the cart/checkout purchase buttons, so
// we map it to "checkout".
export const resolveVerifyFlowSource = (marker: unknown): string => {
  if (marker === "open Story") return "story";
  if (marker === "open chat") return "chat";
  if (marker === "seller") return "seller";
  if (typeof marker === "string" && marker.length > 0) return marker;
  return "checkout";
};
