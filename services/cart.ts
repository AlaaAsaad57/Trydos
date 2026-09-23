import { useAppStore } from "store";
import { _isStoreLastJson } from "utils/functions";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";
import { readRdbLock } from "./rdbPayment";
import { ORDER_EVENTS, trackOrder } from "utils/orderFunnel";

class CartService {
  async AddToCart({
    product_id,
    color,
    choice_1,
    product_variation_id = null,
    qty,
    image,
    isFromAddWidget = false,
    is_luck = false,
    type,
    offer_price,
  }) {
    const { addProductToCart } = useAppStore.getState();
    const imageVar = image?.split("/")[image?.split("/").length - 1];
    let details = {
      product_id: product_id,
      id: product_id,
      image: imageVar,
      quantity: qty,
      product_variation_id: product_variation_id ?? null,
      is_luck,
    };


    try {
      let response = await fetchData({
        url: "/cart/add",
        body: JSON.stringify({
          ...details,
        }),
        reqTitle: isFromAddWidget
          ? REQUESTS_DATA.ADD_TO_CART_WIDGET
          : REQUESTS_DATA.ADD_TO_CART,
        method: "POST",
        server: "market",
      });
      // The core backend refuses every cart write while an RDB payment request
      // is pending. That is not a fault: the shopper has to finish or cancel
      // the payment first, and the lock sheet says so.
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "cart" });
        return false;
      }
      if (!response.success) {
        throw new Error(response.message);
      }
      if (response?.data?.status === 1 && response?.data?.id_cart) {
        // home.subscribeToTopic({
        //   topic: `product_availability_${product_id}`,
        // });

        addProductToCart({
          id: product_id,
          item_id: response?.data?.id_cart,
          product_variation_id: product_variation_id ?? null,
          color,
          size: choice_1,
          image,
          quantity: 1,
          type,
          offer_price,
        });
        return true;
      }
      return false;
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In AddToCart in services/cart",
      });
      return false;
    }
  }
  /** Change the quantity of one cart row.
   *
   *  Returns `true` only when the core backend took the new quantity.
   *
   *  `onRefused` tells the caller about one case the `false` cannot: the core
   *  backend answered, and said no (`data.status` is not 1). That is a refusal
   *  on stock, not a failed request, and the cart row offers to notify the
   *  shopper for it. Every other failure — a refused request, a thrown error —
   *  leaves `onRefused` alone, so a network fault is never blamed on the
   *  product. */
  async UpdateCart({
    cart_id,
    qty,
    isFromAddWidget = false,
    is_luck = false,
    onRefused = null,
  }: {
    cart_id: any;
    qty: any;
    isFromAddWidget?: boolean;
    is_luck?: boolean;
    onRefused?: ((refusal: { status: any; qty: any }) => void) | null;
  }) {
    const { updateProductQuantityInCart } = useAppStore.getState();


    try {
      let response = await fetchData({
        url: "/cart/update",
        body: JSON.stringify({
          key: cart_id,
          quantity: qty,
        }),
        reqTitle: isFromAddWidget
          ? REQUESTS_DATA.ADD_TO_CART_WIDGET
          : REQUESTS_DATA.UPDATE_CART_ITEM,
        method: "POST",
        server: "market",
      });
      // The core backend refuses every cart write while an RDB payment request
      // is pending. That is not a fault: the shopper has to finish or cancel
      // the payment first, and the lock sheet says so.
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "cart" });
        return false;
      }
      if (!response.success) {
        // `fetchData` handles a `/cart/update` refusal itself: it shows the
        // toast and throws (utils/fetchData.ts:734-737), then catches its own
        // throw and returns the whole body with `success: false`
        // (:807-810). So a refusal reaches here looking like a failed call
        // while still carrying the core backend's answer. Read that answer
        // before treating it as an error — otherwise the two are the same
        // `false` and the caller can never tell them apart.
        if (response?.data?.status === 0) {
          onRefused?.({ status: 0, qty: response?.data?.qty });
          return false;
        }
        throw new Error(response.message);
      }
      if (response?.data?.status === 1 && parseInt(response?.data?.qty) >= 0) {
        updateProductQuantityInCart({
          id: cart_id,
          qty: parseInt(response?.data?.qty),
        });
        return true;
      }
      onRefused?.({ status: response?.data?.status, qty: response?.data?.qty });
      return false;
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In UpdateCart in services/cart",
      });
      return false;
    }
  }
  async RemoveFromCart({ cart_item, isFromAddWidget = false }) {
    const { errRemoveFromCart, removeFromCart } = useAppStore.getState();
    try {
      let response = await fetchData({
        url: "/cart/remove",
        body: JSON.stringify({ key: cart_item?.item_id }),
        reqTitle: isFromAddWidget
          ? REQUESTS_DATA.ADD_TO_CART_WIDGET
          : REQUESTS_DATA.REMOVE_FROM_CART,
        method: "POST",
        server: "market",
      });
      // The core backend refuses every cart write while an RDB payment request
      // is pending. That is not a fault: the shopper has to finish or cancel
      // the payment first, and the lock sheet says so.
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "cart" });
        return false;
      }
      if (!response.success) {
        throw new Error(response.message);
      }
      removeFromCart(cart_item?.item_id);
      return true;
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In RemoveFromCart in services/cart",
      });
      errRemoveFromCart(cart_item);
      return false;
    }
  }
  async ConvertToOldCart({ cart_item }) {
   
    try {
      let response = await fetchData({
        url: "/cart/convert_to_old",
        body: JSON.stringify({ key: cart_item }),
        reqTitle: REQUESTS_DATA.CONVERT_TO_OLD_CART,
        method: "POST",
        server: "market",
      });
      // The core backend refuses every cart write while an RDB payment request
      // is pending. That is not a fault: the shopper has to finish or cancel
      // the payment first, and the lock sheet says so.
      const lock = readRdbLock(response);
      if (lock) {
        useAppStore.getState().setRdbLock(lock);
        trackOrder(ORDER_EVENTS.RDB_CART_LOCK_HIT, { at: "cart" });
        return false;
      }
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return true;
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In ConvertToOldCart in services/cart",
      });
      return false;
    }
  }
}
export default new CartService();
