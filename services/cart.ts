import { useAppStore } from "store";
import { _isStoreLastJson } from "utils/functions";
import home from "./home";
import { fetchData } from "utils/fetchData";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";

class CartService {
  async AddToCart({
    product_id,
    color,
    choice_1,
    product_variation_id = null,
    qty,
    image,
    isFromAddWidget = false,
    is_redeem = false,
    type,
    offer_price,
  }) {
    const { addProductToCart } = useAppStore.getState();
    const imageVar = image.split("/")[image.split("/").length - 1];
    let details = {
      id: product_id,
      image: imageVar,
      quantity: qty,
      product_variation_id: product_variation_id ?? null,
      is_redeem,
    };
    let formBody = [];
    for (var property in details) {
      if (details[property]) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(details[property]);
        formBody.push(encodedKey + "=" + encodedValue);
      }
    }
    // @ts-ignore
    formBody = formBody.join("&");

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
  async UpdateCart({
    cart_id,
    qty,
    isFromAddWidget = false,
    is_redeem = false,
  }) {
    const { updateProductQuantityInCart } = useAppStore.getState();

    let dataBody: any = [];
    let dataObj = { key: cart_id, quantity: qty };
    for (var property in dataObj) {
      if (dataObj[property] || dataObj[property] === 0) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(dataObj[property]);
        dataBody.push(encodedKey + "=" + encodedValue);
      }
    }
    dataBody = dataBody.join("&");
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
      if (!response.success) {
        throw new Error(response.message);
      }
      if (response?.data?.status === 1 && parseInt(response?.data?.qty) >= 0) {
        updateProductQuantityInCart({
          id: cart_id,
          qty: parseInt(response?.data?.qty),
        });
        return true;
      }
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
    let dataBody = [];
    let dataObj = { key: cart_item };
    for (var property in dataObj) {
      if (dataObj[property] || dataObj[property] === 0) {
        var encodedKey = encodeURIComponent(property);
        var encodedValue = encodeURIComponent(dataObj[property]);
        dataBody.push(encodedKey + "=" + encodedValue);
      }
    }
    // @ts-ignore
    dataBody = dataBody.join("&");

    try {
      let response = await fetchData({
        url: "/cart/convert_to_old",
        body: JSON.stringify({ key: cart_item }),
        reqTitle: REQUESTS_DATA.CONVERT_TO_OLD_CART,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In ConvertToOldCart in services/cart",
      });
    }
  }
}
export default new CartService();
