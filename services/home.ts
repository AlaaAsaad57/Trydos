"use client";
import { useAppStore } from "store";
import {
  _isStoreLastJson,
  getCart,
  LogError,
  translateFunction,
  WaitForCondition,
} from "utils/functions";
import { smartlookIdentify } from "utils/smartlook";

import {
  CUSTOMER_INFO_URL,
  FIREBASE_SETTINGS_URL,
  STARTER_SETTINGS,
} from "utils/endpointConfig";
import auth from "./auth";
import LocalizationServiceClass from "./localization";
import chat from "./chat";
import { SetGAUser } from "utils/gtag";
import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";
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
        const { userChat } = useAppStore.getState();
        if (userChat) chat.getChats(false);
      }, 5000);
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In getClientData in services/home",
      });
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
      LogServerError({
        error: err,
        scenario: "Error In GetFireBaseSettings in services/home",
      });
      // Handle error as needed, e.g., set state or log
      const { getFirebaseSettings } = useAppStore.getState();
      getFirebaseSettings(null);
    }
  }
  async getCustomerInfo() {
    const { updateUserInfo } = useAppStore.getState();
    await WaitForCondition();
    try {
      let response_customer_Info: any = await fetchData({
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
      // Update server-side HttpOnly cookie
      fetch("/api/auth/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          updates: [
            {
              name: COOKIE_NAMES.USER_DATA,
              value: response_customer_Info.data.customer_info,
            },
          ],
        }),
        credentials: "include",
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
      LogServerError({
        error: error,
        scenario: "Error In getCustomerInfo in services/home",
      });
      showErrorNotification("Customer Info Error");
    }
  }

  async registerForExpire(id?: number) {
    const {
      isRegisteringReady,
      setIsRegisteringReady,
      LoggingOut,
      loginSuccess,
    } = useAppStore.getState();

    if (LoggingOut) return;
    if (!isRegisteringReady) return;

    setIsRegisteringReady(false);
    const userId = id || auth.UserID();

    try {
      const [country, lang] = (
        window.location.pathname.split("/")[1] || ""
      ).split("-");
      const response = await fetch("/api/auth/register-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-country": country || "sy",
          "x-language": lang || "en",
        },
        body: JSON.stringify({ old_guest_user_id: userId || null }),
        credentials: "include",
      });

      const repo = await response.json();
      if (!response.ok) {
        throw new Error(repo.message);
      }
      if (useAppStore.getState().LoggingOut) return;

      if (repo.data?.user) {
        loginSuccess({
          ...repo.data.user,
          expired_at: repo.data.expires_at,
        });
        if (process.env.NODE_ENV === "production")
          smartlookIdentify(repo.data.user.id, {
            name: repo.data.user.name,
            phone: "guest",
          });
      }
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In registerForExpire in services/home",
      });
    } finally {
      setIsRegisteringReady(true);
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
              LogServerError({
                error: err,
                scenario: "Error In onMessageListener in services/home",
              });
            });
        }
      }
    } catch (error) {
      LogError(error);
      LogServerError({
        error: error,
        scenario: "Error In AllowNotifications in services/home",
      });
      throw new Error(
        translateFunction(
          "Notification Is Not Enabled! please Allow Notification Access",
        ),
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
    const {
      loginSuccess,
      loginSuccessChat,
      loginSuccessStories,
      editUserInfo,
    } = useAppStore.getState();

    // Fetch user data from HttpOnly cookies via server route
    let userData: any = null;
    let userChat: any = null;
    let userStories: any = null;
    let hasDeviceToken = false;
    let hasMarketToken = false;

    try {
      const meResponse = await fetch("/api/auth/me", {
        credentials: "include",
        method: "POST",
      });
      if (meResponse.ok) {
        const meData = await meResponse.json();
        userData = meData.user;
        userChat = meData.chatUser;
        userStories = meData.storiesUser;
        hasDeviceToken = meData.hasDeviceToken;
        hasMarketToken = meData.hasMarketToken;
      }
    } catch (_) {}

    if (userData) {
      editUserInfo(userData);
      SetGAUser(userData, false);
    }

    if (!hasDeviceToken) await this.RegisterDevice();

    if (userData && userData?.is_phone_verified === 1 && hasMarketToken) {
      if (process.env.NODE_ENV === "production")
        smartlookIdentify(userData.id, {
          name: userData.name,
          phone: userData.mobilePhone,
        });
      loginSuccess({
        ...userData,
        idToken: localStorage.getItem("ID-TOKEN"),
        name: userData.name,
        image: userData.image,
      });
      if (userChat) loginSuccessChat({ ...userChat });
      if (userStories) loginSuccessStories({ ...userStories });
    } else {
      if (userData) {
        if (process.env.NODE_ENV === "production")
          smartlookIdentify(userData.id, {
            name: userData.name,
            phone: userData.mobilePhone,
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
    const { isRegisteringReady, setIsRegisteringReady, loginSuccess } =
      useAppStore.getState();

    if (!isRegisteringReady) return;

    setIsRegisteringReady(false);
    const userId = auth.UserID();
    const isNewUser = !userId;

    try {
      const [country, lang] = (
        window.location.pathname.split("/")[1] || ""
      ).split("-");
      const response = await fetch("/api/auth/register-device", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-country": country || "sy",
          "x-language": lang || "en",
        },
        body: JSON.stringify({ old_guest_user_id: userId || null }),
        credentials: "include",
      });

      const repo = await response.json();
      if (!response.ok) {
        throw new Error(repo.message);
      }

      if (repo.data?.user) {
        loginSuccess({
          ...repo.data.user,
          expired_at: repo.data.expires_at,
        });
      }
      SetGAUser(repo.data?.user, isNewUser);
      if (repo.data?.user) {
        if (process.env.NODE_ENV === "production")
          smartlookIdentify(repo.data.user.id, {
            name: repo.data.user.name,
            phone: "guest",
          });
      }
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In RegisterDevice in services/home",
      });
    } finally {
      setIsRegisteringReady(true);
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
        LogServerError({
          error: err,
          scenario: "Error In subscribeToTopic in services/home",
        });
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
      LogServerError({
        error: err,
        scenario: "Error In UnsubscripeFromTopic in services/home",
      });
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
        LogServerError({
          error: err,
          scenario: "Error In handleTopicsOnPageRefresh in services/home",
        });
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
      LogServerError({
        error: e,
        scenario: "Error In hideOldCart in services/home",
      });
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
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In EditNotificationSettings in services/home",
      });
    }
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
