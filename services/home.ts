"use client";
import { useAppStore } from "store";

import Cookies from "js-cookie";
import userImage from "public/images/profileNo.png";
import {
  _isStoreLastJson,
  AddToCartAnimation,
  getCart,
  getLang,
  urlParams,
  WaitForCondition,
} from "utils/functions";
import Smartlook from "smartlook-client";

import {
  CUSTOMER_INFO_URL,
  FIREBASE_SETTINGS_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import { SSRDetect } from "utils/functions";
import axios from "axios";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { changeToken } from "store/homepage/cachedActions";
import { RegisterGuestApi } from "models/API/market/RegisterGuest";
import { CustomerInfoResponse } from "models/API/market/CustomerInfo";
import auth from "./auth";
import { UpdateCartApi } from "models/API/market/UpdateCart";
import LocalizationServiceClass from "./localization";
import chat from "./chat";
import { SetGAUser } from "utils/gtag";
import { starttingSettingApi } from "models/API/market/StarttingSetting";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
const getHeader = () => {
  let [countryUrl, languageUrl] = window.location.pathname
    .split("/")[1]
    .split("-");
  return {
    next: {
      revalidate: parseInt(process.env.NEXT_PUBLIC_REVALIDATE),
    },
    headers: {
      Authorization: `Bearer ${
        localStorage.getItem("MARKET-TOKEN") ||
        localStorage.getItem("DEVICE-TOKEN")
      }`,
      lang: getLang(languageUrl, Cookies.get("language")),
      country: countryUrl || Cookies.get("country"),
      accept: "application/json",
    },
  };
};
class HomeService {
  async getClientData() {
    const { setSettings, initCart } = useAppStore.getState();

    try {
      if (sessionStorage.getItem("starttingSetting")) {
        let data = sessionStorage.getItem("starttingSetting");
        setSettings(JSON.parse(data));
      } else {
        const response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + STARTER_SETTINGS,
          getHeader()
        );
        let repo: { data: starttingSettingApi } = await response.json();
        setSettings(repo.data);
        sessionStorage.setItem("starttingSetting", JSON.stringify(repo.data));
        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      }
      await this.getCustomerInfo();

      getCart({
        callback: ([data, res]) => {
          initCart(data ?? { cart: [] });
        },
      });
      // await getOldCart();

      setTimeout(() => {
        if (localStorage.getItem("USER") && localStorage.getItem("USER-CHAT"))
          chat.getChats(false);
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  }
  async GetFireBaseSettings() {
    const response = await fetchData({
      url: FIREBASE_SETTINGS_URL,
      reqTitle: "get firebase settings request",
      method: "GET",
      server: "market",
    });
    const { getFirebaseSettings } = useAppStore.getState();
    getFirebaseSettings(response.data?.firebase_settings);
  }
  async getCustomerInfo() {
    const { updateUserInfo } = useAppStore.getState();
    await WaitForCondition();
    // const response = await fetch(
    //   process.env.NEXT_PUBLIC_BACKEND_URL + CUSTOMER_INFO_URL,
    //   { ...getHeader(), priority: "high" }
    // );
    let response_customer_Info: { data: CustomerInfoResponse } =
      await fetchData({
        url: CUSTOMER_INFO_URL,
        reqTitle: "get customer info",
        method: "GET",
        server: "market",
      });

    try {
      if (response_customer_Info.data.customer_info) {
        if (response_customer_Info.data.customer_info) {
          updateUserInfo(response_customer_Info.data.customer_info);

          if (
            response_customer_Info.data.customer_info?.is_phone_verified !== 1
          ) {
            await auth.ExpiredUser(true);
          }
        }
      } else {
        throw new Error("Customer Info Error");
      }
    } catch (error) {
      showErrorNotification("Customer Info Error");
    }
  }
  async checkExpiration(bool) {
    const { setLoginOpen } = useAppStore.getState();
    if (localStorage.getItem("USER")) {
      if (bool) {
        const { cancelAuth } = useAppStore.getState();
        cancelAuth();
        Cookies.remove("MARKET-TOKEN");
        localStorage.clear();
        setLoginOpen(true);
      }
    } else if (localStorage.getItem("guest-user") || bool) {
      Cookies.remove("MARKET-TOKEN");
      // Split the date into day, month, year

      if (bool) {
        Cookies.remove("DEVICE-TOKEN");

        // localStorage.clear();
        setTimeout(async () => {
          await this.registerForExpire();
        }, 2000);
      }
    }
  }
  async registerForExpire(id?: number) {
    const { isRegisteringReady, setIsRegisteringReady } =
      useAppStore.getState();

    if (isRegisteringReady) {
      let body = id
        ? { old_guest_user_id: id }
        : localStorage.getItem("guest-user") &&
          JSON.parse(localStorage.getItem("guest-user"))?.id
        ? {
            old_guest_user_id: JSON.parse(localStorage.getItem("guest-user"))
              .id,
          }
        : { old_guest_user_id: null };

      try {
        setIsRegisteringReady(false);
        let response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
          {
            method: "POST",
            priority: "high",
            body: body.old_guest_user_id
              ? new URLSearchParams({
                  old_guest_user_id: body.old_guest_user_id,
                })
              : "old_guset_user_id=null",
            ...getHeader(),
            cache: "no-cache",
          }
        );
        let repo: RegisterGuestApi = await response.json();
        if (repo.isSuccessful) {
        } else {
          if (repo.message === "The user does not exist.") {
            response = await fetch(
              process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
              {
                method: "POST",
                priority: "high",
                body: "old_guset_user_id=null",
                ...getHeader(),
                cache: "no-cache",
              }
            );
            repo = await response.json();
          }
        }
        changeToken({ key: "DEVICE-TOKEN", value: repo.data.token });
        localStorage.setItem("DEVICE-TOKEN", repo.data.token);
        Cookies.set("DEVICE-TOKEN", repo.data.token, {
          expires: 365,
        });
        localStorage.setItem(
          "guest-user",
          JSON.stringify({
            ...repo.data.user,
            expired_at: repo.data.expires_at,
          })
        );
        if (repo.data.user) {
          if (process.env.NODE_ENV === "production" && Smartlook.initialized())
            Smartlook.identify(repo.data.user.id, {
              name: repo.data.user.name,
              phone: "guest",
              // other custom properties
            });
        }
        setIsRegisteringReady(true);
      } catch (error) {
        setIsRegisteringReady(true);
      }
    }
  }
  async RequestFireBase() {
    const permission = await Notification.requestPermission();

    if (permission !== "granted") {
      console.log("Notification permission denied or dismissed.");
      return null;
    }
    const { requestFirebaseNotificationPermission, onMessageListener } =
      await import("utils/firebaseInitv1");
    await requestFirebaseNotificationPermission().then(async (token) => {
      // @ts-ignore
      if (token) {
        localStorage.setItem("FB-DEVICE-TOKEN", token);
        setTimeout(async () => {
          if (auth.UserToken() && auth.UserID()) {
            await AxiosPost({
              url:
                process.env.NEXT_PUBLIC_BACKEND_URL + "/firebase_device_tokens",
              body: {
                device_token: token,
                user_id: auth.UserID(),
                auth_token: auth.UserToken(),
              },
              title: "register firebase token",
            });
          }
        }, 2000);
        // ininit
      }
    });
    typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      onMessageListener()
        .then((payload) => {})
        .catch((err) => {
          console.log(err);
        });
  }
  async CheckLogin() {
    const { loginSuccess } = useAppStore.getState();
    if (auth.getUser()) {
      SetGAUser(auth.getUser(), false);
    }
    if (!localStorage.getItem("FB-DEVICE-TOKEN")) await this.RegisterDevice();
    if (
      SSRDetect() &&
      localStorage.getItem("USER") &&
      JSON.parse(localStorage.getItem("USER"))?.is_verified &&
      localStorage.getItem("ID-TOKEN") &&
      localStorage.getItem("MARKET-TOKEN")
    ) {
      Cookies.set("MARKET-TOKEN", localStorage.getItem("MARKET-TOKEN"));
      changeToken({
        key: "MARKET-TOKEN",
        value: localStorage.getItem("MARKET-TOKEN"),
      });
      if (process.env.NODE_ENV === "production" && Smartlook.initialized())
        Smartlook.identify(JSON.parse(localStorage.getItem("USER")).id, {
          name: JSON.parse(localStorage.getItem("USER")).name,
          phone: JSON.parse(localStorage.getItem("USER")).mobilePhone,
          // other custom properties
        });
      loginSuccess({
        id: JSON.parse(localStorage.getItem("USER")).id,
        idToken: localStorage.getItem("ID-TOKEN"),
        name: JSON.parse(localStorage.getItem("USER")).name,
        avatar: JSON.parse(localStorage.getItem("USER")).avatar || userImage,
      });
    } else {
      if (localStorage.getItem("guest-user")) {
        if (process.env.NODE_ENV === "production" && Smartlook.initialized())
          Smartlook.identify(
            JSON.parse(localStorage.getItem("guest-user")).id,
            {
              name: JSON.parse(localStorage.getItem("guest-user")).name,
              phone: JSON.parse(localStorage.getItem("guest-user")).mobilePhone,
              // other custom properties
            }
          );
      }
      this.RegisterDevice();
    }
    auth.CheckUserName();
    await this.RequestFireBase();
  }
  async RegisterDevice() {
    const { isRegisteringReady, setIsRegisteringReady } =
      useAppStore.getState();

    if (isRegisteringReady) {
      let isNewUser = !localStorage.getItem("guest-user");
      let body =
        localStorage.getItem("guest-user") &&
        JSON.parse(localStorage.getItem("guest-user"))?.id
          ? {
              old_guest_user_id: JSON.parse(localStorage.getItem("guest-user"))
                ?.id,
            }
          : { old_guest_user_id: null };
      if (
        !Cookies.get("DEVICE-TOKEN") &&
        localStorage.getItem("DEVICE-TOKEN")
      ) {
        changeToken({
          key: "DEVICE-TOKEN",
          value: localStorage.getItem("DEVICE-TOKEN"),
        });
        Cookies.set("DEVICE-TOKEN", localStorage.getItem("DEVICE-TOKEN"), {
          expires: 365,
        });
      }
      if (
        SSRDetect() &&
        !localStorage.getItem("DEVICE-TOKEN") &&
        !localStorage.getItem("USER")
      ) {
        setIsRegisteringReady(false);
        let response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL + REGISTER_DEVICE_URL,
          {
            method: "POST",
            priority: "high",
            body: body.old_guest_user_id
              ? new URLSearchParams({
                  old_guest_user_id: body.old_guest_user_id,
                })
              : "old_guset_user_id=null",
            ...getHeader(),
          }
        );
        let repo: RegisterGuestApi = await response.json();

        localStorage.setItem("DEVICE-TOKEN", repo.data.token);
        changeToken({ key: "DEVICE-TOKEN", value: repo.data.token });

        Cookies.set("DEVICE-TOKEN", repo.data.token, {
          expires: 365,
        });
        if (repo?.data?.user) {
          localStorage.setItem(
            "guest-user",
            JSON.stringify({
              ...repo.data.user,
              expired_at: repo.data.expires_at,
            })
          );
        }
        SetGAUser(repo.data.user, isNewUser);
        localStorage.removeItem("customer-info");
        setIsRegisteringReady(true);
        if (repo.data.user) {
          if (process.env.NODE_ENV === "production" && Smartlook.initialized())
            Smartlook.identify(repo.data.user.id, {
              name: repo.data.user.name,
              phone: "guest",
              // other custom properties
            });
          await this.RequestFireBase();
        }

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      }
    }
  }
  async AddToCart({
    id,
    size,
    color,
    image,
    quantity,
    callback,
    alreadyExist,
    errCallback,
    slug,
  }: {
    id: number;
    size: string;
    color: string;
    image: string;
    quantity: number;
    callback: Function;
    alreadyExist: boolean | number;
    errCallback?: Function;
    slug: string;
  }) {
    let language_code = window.location.pathname.split("/")[1].split("-")[1];
    let country_code = window.location.pathname.split("/")[1].split("-")[0];
    const { setLoadedCart, disableAddToCartOption } = useAppStore.getState();

    if (alreadyExist) {
      let dataBody = [];
      let dataObj = { key: alreadyExist, quantity: quantity + 1 || 0 };
      for (var property in dataObj) {
        if (dataObj[property] || dataObj[property] === 0) {
          var encodedKey = encodeURIComponent(property);
          var encodedValue = encodeURIComponent(dataObj[property]);
          dataBody.push(encodedKey + "=" + encodedValue);
        }
      }
      // request
      // @ts-ignore
      dataBody = dataBody.join("&");

      let res: UpdateCartApi;

      res = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/update",
        body: dataBody,
        title: "Update  Quantity For Product in Cart",
      });

      setLoadedCart(true);
      if (res?.qty >= 0 && res?.status !== 0) {
        callback({ id: alreadyExist });
      } else {
        errCallback();
        disableAddToCartOption();
      }
    } else {
      const imageVar = image.split("/")[image.split("/").length - 1];
      let details = { id, color, image: imageVar, quantity, choice_1: size };
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
      let res: UpdateCartApi;
      try {
        res = await AxiosPost({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/add",
          body: formBody,
          title: "Add  Product to Cart",
        });
      } catch (error) {
        setLoadedCart(true);
        return;
      }
      setLoadedCart(true);
      if (res?.id_cart) {
        callback({ id: res?.id_cart });
        await this.subscribeToTopic({
          topic: `product_availability_${id}`,
        });
      } else {
        errCallback();

        showErrorNotification(res?.message || "Failed");
      }
    }
  }

  async subscribeToTopic({
    topic,
    variant,
  }: {
    topic: string;
    variant?: string;
  }) {
    const { getFirebaseSettings } = useAppStore.getState();
    let token = localStorage.getItem("FB-DEVICE-TOKEN");

    if (token) {
      let response = await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/subscribe_topic",
        body: {
          topic,
          variant,
        },
        title: "store firebase tsubscribe opic",
      });

      getFirebaseSettings(response.firebase_settings);
    }
  }
  async UnsubscripeFromTopic({ topic }) {
    const { getFirebaseSettings } = useAppStore.getState();

    let response = await AxiosPost({
      url:
        process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/unsubscribe_topic",
      body: {
        topic,
      },
      title: "store firebase unsubscribe topic",
    });
    getFirebaseSettings(response.firebase_settings);
  }
  async handleTopicsOnPageRefresh(token: string) {
    // Extract country and language from the URL
    const [countryCode, languageCode] = window.location.pathname
      .split("/")[1]
      .split("-");
    const lastPair = localStorage.getItem("lastPair");
    if (!countryCode || !languageCode) {
      throw new Error("Invalid URL format for country-language pair");
    }
    const { getFirebaseSettings } = useAppStore.getState();

    if (!token) return;

    if (lastPair !== countryCode + languageCode) {
      AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/change_country_language",
        body: {
          country: countryCode,
          language_code: languageCode,
        },
        title: "change firebase country-language pair",
      }).then((firebase_settings) => {
        getFirebaseSettings(firebase_settings);
      });
      localStorage.setItem("lastPair", countryCode + languageCode);
    }
  }

  async hideOldCart({ id }: { id?: number }) {
    try {
      await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/old-cart/hide",
        body: { id: id },
        title: "Hide Old Cart",
      });
    } catch (error) {}
  }
  async TestNotificationBoutique({ boutique_id }) {
    await this.subscribeToTopic({ topic: "boutique_created" });
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_boutique_created",
      {
        boutique_id: 144,
        topic: "boutique_created",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductToOldCart() {
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_cart_expiration",
      {
        product_id: 7681,
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductAvailable() {
    await this.subscribeToTopic({
      topic: "product_availability_7681",
      variant: "Blue-XXL",
    });

    await axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/firebase_device_tokens/send_product_availability",
        {
          product_id: 7681,
          variant: "Blue-XXL",
          topic: "product_availability_7681",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        },
        { ...getHeader() }
      )
      .catch((s) => {
        console.error(s);
      });
  }

  async TestNotificationProductComment() {
    await this.subscribeToTopic({ topic: "product_comment_7681" });
    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_comment",
      {
        product_id: 7681,
        topic: "product_comment_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationProductDiscount() {
    await this.subscribeToTopic({ topic: "product_discount_7681" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_discount",
      {
        product_id: 7681,
        topic: "product_discount_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationCategoryCreated() {
    await this.subscribeToTopic({ topic: "category_created" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_category_created",
      {
        category_id: 392,
        topic: "category_created",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  //before stock out and change in price
  async TestNotificationBeforeStockOut() {
    await this.subscribeToTopic({ topic: "product_before_stock_out_7681" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_before_stock_out",
      {
        user_id: auth.UserID(),
        product_id: 7681,
        topic: "product_before_stock_out_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async TestNotificationChangeInPrice() {
    await this.subscribeToTopic({ topic: "product_when_change_in_price_7681" });

    await axios.post(
      process.env.NEXT_PUBLIC_BACKEND_URL +
        "/firebase_device_tokens/send_product_when_change_in_price",
      {
        user_id: auth.UserID(),
        product_id: 7681,
        topic: "product_when_change_in_price_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      },
      { ...getHeader() }
    );
  }
  async RemoveFromCart({ key }) {
    try {
      AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/cart/remove",
        body: { key: key },
        title: "Remove From Cart",
      });
    } catch (error) {
      throw error;
    }
  }
  async StoreNotificationProduct({ type_id, variant, product_id }) {
    let detail = {
      user_id: auth.UserID(),
      product_id: product_id,
      notification_type_id: type_id,
      variant: variant,
    };
    var formBody: any = [];
    for (var property in detail) {
      var encodedKey = encodeURIComponent(property);
      var encodedValue = encodeURIComponent(detail[property]);
      formBody.push(encodedKey + "=" + encodedValue);
    }
    formBody = formBody.join("&");
    await axios
      .post(
        process.env.NEXT_PUBLIC_BACKEND_URL + "/product_notification/store",
        formBody,
        { ...getHeader() }
      )
      .catch((e) => {});
  }
  async EditNotificationSettings({ url, body }) {
    try {
      await AxiosPost({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          `/firebase_device_tokens/${url}`,
        body: body,
        title: "Remove From Cart",
      });
    } catch (error) {}
  }
}

export default new HomeService();
