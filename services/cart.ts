import { useAppStore } from "store";
import Cookies from "js-cookie";
import { _isStoreLastJson, AddToCartAnimation, getLang } from "utils/functions";
import home from "./home";
import { AxiosPost } from "utils/AxiosApi";

const getHeader = () => {
  let [countryUrl, languageUrl] = window.location.pathname
    .split("/")[1]
    .split("-");
  return {
    headers: {
      "ssr-req": "true",
      Authorization: `Bearer ${
        localStorage.getItem("MARKET-TOKEN") ||
        localStorage.getItem("DEVICE-TOKEN")
      }`,
      lang: getLang(languageUrl, Cookies.get("language")),
      country: countryUrl || Cookies.get("country"),
    },
  };
};
class CartService {
  async AddToCart({ product_id, color, choice_1, qty, image }) {
    const { addProductToCart } = useAppStore.getState();
    const imageVar = image.split("/")[image.split("/").length - 1];
    let details = {
      id: product_id,
      color,
      image: imageVar,
      quantity: qty,
      choice_1,
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
    AddToCartAnimation();
    try {
      let res = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/add",
        body: formBody,
      });
      if (res?.status === 1 && res?.id_cart) {
        home.subscribeToTopic({
          topic: `product_availability_${product_id}`,
        });
        addProductToCart({
          id: product_id,
          item_id: res?.id_cart,
          color,
          size: choice_1,
          image,
          quantity: 1,
        });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  async UpdateCart({ cart_id, qty }) {
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
      let res = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/update",
        body: dataBody,
      });
      if (res?.status === 1 && parseInt(res?.qty) >= 0) {
        updateProductQuantityInCart({ id: cart_id, qty: parseInt(res?.qty) });
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  }
  async RemoveFromCart({ cart_item }) {
    const { errRemoveFromCart, removeFromCart } = useAppStore.getState();
    try {
      let res = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/remove",
        body: { key: cart_item?.item_id },
        title: "Remove From Cart",
      });

      removeFromCart(cart_item?.item_id);
      return true;
    } catch (error) {
      errRemoveFromCart(cart_item);
      return false;
    }
  }
}
export default new CartService();
