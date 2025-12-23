"use client";
import { useAppStore } from "store";
import {
  _isStoreLastJson,
  getCart,
  getUserChat,
  LogError,
  translateFunction,
  WaitForCondition,
} from "utils/functions";
import Smartlook from "smartlook-client";

import {
  CUSTOMER_INFO_URL,
  FIREBASE_SETTINGS_URL,
  REGISTER_DEVICE_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";

import { RegisterGuestApi } from "models/API/market/RegisterGuest";
import { CustomerInfoResponse } from "models/API/market/CustomerInfo";
import auth from "./auth";
import LocalizationServiceClass from "./localization";
import chat from "./chat";
import { SetGAUser } from "utils/gtag";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import {
  COOKIE_NAMES,
  getCookie,
  setCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { REQUESTS_DATA } from "utils/Requests";
class HomeService {
  async getClientData() {
    const { setSettings, initCart, language } = useAppStore.getState();

    try {
      // if (sessionStorage.getItem("starttingSetting")) {
      //   let data = sessionStorage.getItem("starttingSetting");
      //   setSettings(JSON.parse(data));
      // } else {

      // }
      const response = await fetchData({
        url: STARTER_SETTINGS + `?language=${language}`,
        reqTitle: REQUESTS_DATA.GET_STARTER_SETTINGS,
        method: "GET",
        server: "market",
        useCached: true,
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      setSettings(response.data);
      sessionStorage.setItem("starttingSetting", JSON.stringify(response.data));
      await this.getCustomerInfo();

      getCart({
        callback: ([data, res]) => {
          initCart(data ?? { cart: [] });
        },
      });
      // await getOldCart();

      setTimeout(() => {
        const chatUser = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
        if (chatUser) chat.getChats(false);
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  }
  async GetFireBaseSettings() {
    try {
      const response = await fetchData({
        url: FIREBASE_SETTINGS_URL,
        reqTitle: REQUESTS_DATA.GET_FIREBASE_SETTINGS_REQUEST,
        method: "GET",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      const { getFirebaseSettings } = useAppStore.getState();
      getFirebaseSettings(response.data?.firebase_settings);
    } catch (err) {
      // Handle error as needed, e.g., set state or log
      const { getFirebaseSettings } = useAppStore.getState();
      getFirebaseSettings(null);
    }
  }
  async getCustomerInfo() {
    const { updateUserInfo } = useAppStore.getState();
    await WaitForCondition();
    try {
      let response_customer_Info: { data: CustomerInfoResponse } =
        await fetchData({
          url: CUSTOMER_INFO_URL,
          reqTitle: REQUESTS_DATA.GET_CUSTOMER_INFO,
          method: "GET",
          server: "market",
        });
      // @ts-ignore
      if (!response_customer_Info.success) {
        // @ts-ignore
        throw new Error(response_customer_Info.message);
      }
      setCookie(COOKIE_NAMES.USER_DATA, {
        ...response_customer_Info.data.customer_info,
      });
      if (response_customer_Info.data.customer_info) {
        if (response_customer_Info.data.customer_info) {
          updateUserInfo(response_customer_Info.data.customer_info);

          if (
            response_customer_Info.data.customer_info?.is_phone_verified !== 1
          ) {
            await auth.ExpiredUser(true);
          }
        }
        return response_customer_Info.data.customer_info;
      } else {
        throw new Error("Customer Info Error");
      }
    } catch (error) {
      showErrorNotification("Customer Info Error");
    }
  }

  async registerForExpire(id?: number) {
    const { isRegisteringReady, setIsRegisteringReady } =
      useAppStore.getState();

    if (isRegisteringReady) {
      const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
      let requestBody = id
        ? { old_guest_user_id: id }
        : user?.id
        ? {
            old_guest_user_id: user.id,
          }
        : { old_guest_user_id: null };

      try {
        let response = await fetchData({
          url: REGISTER_DEVICE_URL,
          body: JSON.stringify(requestBody),
          reqTitle: REQUESTS_DATA.REGISTER_DEVICE_FOR_EXPIRED_USER,
          method: "POST",
          server: "market",
        });

        let repo: RegisterGuestApi = response;
        // @ts-ignore
        if (!repo.success) {
          throw new Error(repo.message);
        }
        if (repo.message === "The user does not exist.") {
          response = await fetchData({
            url: REGISTER_DEVICE_URL,
            body: JSON.stringify({ old_guest_user_id: null }),
            reqTitle: REQUESTS_DATA["REGISTER_DEVICE_FOR_EXPIRED_USER_-_RETRY"],
            method: "POST",
            server: "market",
          });
          repo = response;
          // @ts-ignore
          if (!repo.success) {
            throw new Error(repo.message);
          }
        }

        setCookie(COOKIE_NAMES.DEVICE_TOKEN, repo.data.token);

        setCookie(COOKIE_NAMES.USER_DATA, {
          ...repo.data.user,
          expired_at: repo.data.expires_at,
        });
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
        console.error(error);
        setIsRegisteringReady(true);
      }
    }
  }

  // new unified action
  async AllowNotifications() {
    try {
      const { requestFirebaseNotificationPermission, onMessageListener } =
        await import("utils/firebaseInitv1");
      const fbtoken = await requestFirebaseNotificationPermission();

      if (fbtoken) {
        // Store token
        localStorage.setItem("FB-DEVICE-TOKEN", fbtoken);

        // Handle topics on page refresh
        await this.handleTopicsOnPageRefresh(fbtoken);

        // Setup message listener
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
          onMessageListener()
            .then((payload) => {})
            .catch((err) => {
              LogError(err);
              console.log(err);
            });
        }
      }
    } catch (error) {
      LogError(error);
      console.error(error);
      throw new Error(
        translateFunction(
          "Notification Is Not Enabled! please Allow Notification Access"
        )
      );
    }
  }
  // get permission status
  getNotificationPermissionStatus(): 1 | 0 | -1 {
    const { setNotificationModal } = useAppStore.getState();
    try {
      if (
        typeof window === "undefined" ||
        typeof Notification === "undefined"
      ) {
        setNotificationModal(true);
        // SSR or browser doesn't support Notification API — treat as "should ask"
        return -1;
      }
      const p = Notification.permission;
      if (p === "granted") {
        this.AllowNotifications();
        return 1;
      }
      if (p === "denied") {
        showErrorNotification(translateFunction("Notification is Denied"));
        return 0;
      }
      // 'default' or any other value => should ask without triggering prompt
      setNotificationModal(true);
      return -1;
    } catch (e) {
      // on any unexpected error return -1 (safe fallback)
      return -1;
    }
  }

  async CheckLogin() {
    const marketToken = getCookie(COOKIE_NAMES.MARKET_TOKEN);
    const deviceToken = getCookie(COOKIE_NAMES.DEVICE_TOKEN);
    const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
    const {
      loginSuccess,
      loginSuccessChat,
      loginSuccessStories,
      editUserInfo,
    } = useAppStore.getState();
    if (userData) {
      console.log(userData, "userprofile");
      editUserInfo(userData);
      SetGAUser(userData, false);
    }
    if (!deviceToken) await this.RegisterDevice();
    if (userData && userData?.is_phone_verified === 1 && marketToken) {
      setCookie(COOKIE_NAMES.MARKET_TOKEN, marketToken);
      if (process.env.NODE_ENV === "production" && Smartlook.initialized())
        Smartlook.identify(userData.id, {
          name: userData.name,
          phone: userData.mobilePhone,
          // other custom properties
        });
      loginSuccess({
        ...userData,
        idToken: localStorage.getItem("ID-TOKEN"),
        name: userData.name,
        image: userData.image,
      });
      if (userChat) {
        loginSuccessChat({
          ...userChat,
        });
      }
      if (userStories) {
        loginSuccessStories({
          ...userStories,
        });
      }
    } else {
      if (userData) {
        if (process.env.NODE_ENV === "production" && Smartlook.initialized())
          Smartlook.identify(userData.id, {
            name: userData.name,
            phone: userData.mobilePhone,
            // other custom properties
          });
        loginSuccess({
          ...userData,
          idToken: localStorage.getItem("ID-TOKEN"),
          name: userData.name,
          image: userData.image,
        });
      } else {
        this.RegisterDevice();
      }
    }
    auth.CheckUserName();
  }

  async RegisterDevice() {
    const deviceToken = getCookie(COOKIE_NAMES.DEVICE_TOKEN);
    const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);

    const { isRegisteringReady, setIsRegisteringReady } =
      useAppStore.getState();

    if (isRegisteringReady) {
      let isNewUser = !userData;
      let requestBody = userData?.id
        ? {
            old_guest_user_id: userData?.id,
          }
        : { old_guest_user_id: null };

      if (!deviceToken) {
        try {
          let response = await fetchData({
            url: REGISTER_DEVICE_URL,
            body: JSON.stringify(requestBody),
            reqTitle: REQUESTS_DATA.REGISTER_DEVICE,
            method: "POST",
            server: "market",
          });
          // @ts-ignore
          if (!response.success) {
            throw new Error(response.message);
          }
          let repo: RegisterGuestApi = response;
          if (repo.message === "The user does not exist.") {
            response = await fetchData({
              url: REGISTER_DEVICE_URL,
              body: JSON.stringify({ old_guest_user_id: null }),
              reqTitle:
                REQUESTS_DATA["REGISTER_DEVICE_FOR_EXPIRED_USER_-_RETRY"],
              method: "POST",
              server: "market",
            });
            // @ts-ignore
            if (!response.success) {
              throw new Error(response.message);
            }
            repo = response;
          }
          setCookie(COOKIE_NAMES.DEVICE_TOKEN, repo.data.token);

          if (repo?.data?.user) {
            setCookie(COOKIE_NAMES.USER_DATA, {
              ...repo.data.user,
              expired_at: repo.data.expires_at,
            });
          }
          SetGAUser(repo.data.user, isNewUser);
          setIsRegisteringReady(true);
          if (repo.data.user) {
            if (
              process.env.NODE_ENV === "production" &&
              Smartlook.initialized()
            )
              Smartlook.identify(repo.data.user.id, {
                name: repo.data.user.name,
                phone: "guest",
                // other custom properties
              });
          }
        } catch (err) {
          console.error(err);
        }
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
      try {
        let response = await fetchData({
          url: "/firebase_device_tokens/subscribe_topic",
          body: JSON.stringify({
            topic,
            variant,
          }),
          reqTitle: REQUESTS_DATA.STORE_FIREBASE_SUBSCRIBE_TOPIC,
          method: "POST",
          server: "market",
        });
        // @ts-ignore
        if (!response.success) {
          throw new Error(response.message);
        }
        getFirebaseSettings(response.data.firebase_settings);
      } catch (err) {
        console.error(err);
      }
    }
  }
  async UnsubscripeFromTopic({ topic }) {
    const { getFirebaseSettings } = useAppStore.getState();
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/unsubscribe_topic",
        body: JSON.stringify({
          topic,
        }),
        reqTitle: REQUESTS_DATA.STORE_FIREBASE_UNSUBSCRIBE_TOPIC,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      getFirebaseSettings(response.data.firebase_settings);
    } catch (err) {
      console.error(err);
    }
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
      try {
        let response = await fetchData({
          url: "/firebase_device_tokens/change_country_language",
          body: JSON.stringify({
            country: countryCode,
            language_code: languageCode,
          }),
          reqTitle: REQUESTS_DATA["CHANGE_FIREBASE_COUNTRY-LANGUAGE_PAIR"],
          method: "POST",
          server: "market",
        });
        // @ts-ignore
        if (!response.success) {
          throw new Error(response.message);
        }
        getFirebaseSettings(response?.data?.firebase_settings);
        localStorage.setItem("lastPair", countryCode + languageCode);
      } catch (err) {
        console.error(err);
      }
    }
  }

  async hideOldCart({ id }: { id?: number }) {
    try {
      let response = await fetchData({
        url: "/old-cart/hide",
        body: JSON.stringify({ id: id }),
        reqTitle: REQUESTS_DATA.HIDE_OLD_CART,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async TestNotificationBoutique({ boutique_id }) {
    await this.subscribeToTopic({ topic: "boutique_created" });
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_boutique_created",
        body: JSON.stringify({
          boutique_id: boutique_id,
          topic: "boutique_created",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_BOUTIQUE_CREATED,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async TestNotificationProductToOldCart() {
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_product_cart_expiration",
        body: JSON.stringify({
          product_id: 7681,
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_PRODUCT_CART_EXPIRATION,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async TestNotificationProductAvailable() {
    await this.subscribeToTopic({
      topic: "product_availability_7681",
      variant: "Blue-XXL",
    });

    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_product_availability",
        body: JSON.stringify({
          product_id: 7681,
          variant: "Blue-XXL",
          topic: "product_availability_7681",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_PRODUCT_AVAILABILITY,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async TestNotificationProductComment() {
    await this.subscribeToTopic({ topic: "product_comment_7681" });
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_product_comment",
        body: JSON.stringify({
          product_id: 7681,
          topic: "product_comment_7681",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_PRODUCT_COMMENT,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async TestNotificationProductDiscount() {
    await this.subscribeToTopic({ topic: "product_discount_7681" });
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_product_discount",
        body: JSON.stringify({
          product_id: 7681,
          topic: "product_discount_7681",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_PRODUCT_DISCOUNT,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async TestNotificationCategoryCreated() {
    await this.subscribeToTopic({ topic: "category_created" });
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_category_created",
        body: JSON.stringify({
          category_id: 392,
          topic: "category_created",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_CATEGORY_CREATED,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  //before stock out and change in price
  async TestNotificationBeforeStockOut() {
    await this.subscribeToTopic({ topic: "product_before_stock_out_7681" });
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_product_before_stock_out",
        body: JSON.stringify({
          user_id: auth.UserID(),
          product_id: 7681,
          topic: "product_before_stock_out_7681",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_PRODUCT_BEFORE_STOCK_OUT,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async TestNotificationChangeInPrice() {
    await this.subscribeToTopic({ topic: "product_when_change_in_price_7681" });
    try {
      let response = await fetchData({
        url: "/firebase_device_tokens/send_product_when_change_in_price",
        body: JSON.stringify({
          user_id: auth.UserID(),
          product_id: 7681,
          topic: "product_when_change_in_price_7681",
          language_code: LocalizationServiceClass.GetAppLanguage(),
          country_iso: LocalizationServiceClass.GetAppCountry(),
        }),
        reqTitle: REQUESTS_DATA.SEND_PRODUCT_WHEN_CHANGE_IN_PRICE,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async EditNotificationSettings({ url, body }) {
    try {
      const response = await fetchData({
        url: `/firebase_device_tokens/${url}`,
        body: JSON.stringify(body),
        reqTitle: REQUESTS_DATA.EDIT_NOTIFICATION_SETTINGS,
        method: "POST",
        server: "market",
      });
      if (!response.success) {
        throw new Error(response.message);
      }
    } catch (error) {}
  }
  async LikeComment({ comment_id, target_type, product_id }) {
    let resp = await fetchData({
      url: "/public_comment/likes/like",
      server: "comments",
      method: "POST",
      body: JSON.stringify({ target_id: comment_id, target_type, product_id }),
      reqTitle: REQUESTS_DATA.LIKE_FOR_COMMENT,
      noMessage: true,
    });
  }
  async UnLikeComment({ comment_id, target_type, product_id }) {
    let resp = await fetchData({
      url: "/public_comment/likes/unlike",
      server: "comments",
      method: "DELETE",
      body: JSON.stringify({ target_id: comment_id, target_type, product_id }),
      reqTitle: REQUESTS_DATA.LIKE_FOR_COMMENT,
      noMessage: true,
    });
  }
}

export default new HomeService();
