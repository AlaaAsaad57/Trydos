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
import {
  COOKIE_NAMES,
  getCookie,
  setCookie,
  UserData,
} from "utils/cookies/cookie-manager";
class HomeService {
  async getClientData() {
    const { setSettings, initCart } = useAppStore.getState();

    try {
      if (sessionStorage.getItem("starttingSetting")) {
        let data = sessionStorage.getItem("starttingSetting");
        setSettings(JSON.parse(data));
      } else {
        const response = await fetchData({
          url: STARTER_SETTINGS,
          reqTitle: "get starter settings",
          method: "GET",
          server: "market",
          useCached: true,
        });
        setSettings(response.data);
        sessionStorage.setItem(
          "starttingSetting",
          JSON.stringify(response.data)
        );
      }
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

    let response_customer_Info: { data: CustomerInfoResponse } =
      await fetchData({
        url: CUSTOMER_INFO_URL,
        reqTitle: "get customer info",
        method: "GET",
        server: "market",
      });
    setCookie(COOKIE_NAMES.USER_DATA, {
      ...response_customer_Info.data.customer_info,
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
        setIsRegisteringReady(false);

        let response = await fetchData({
          url: REGISTER_DEVICE_URL,
          body: JSON.stringify(requestBody),
          reqTitle: "register device for expired user",
          method: "POST",
          server: "market",
        });

        let repo: RegisterGuestApi = response;

        if (repo.message === "The user does not exist.") {
          response = await fetchData({
            url: REGISTER_DEVICE_URL,
            body: JSON.stringify({ old_guest_user_id: null }),
            reqTitle: "register device for expired user - retry",
            method: "POST",
            server: "market",
          });
          repo = response;
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
        setIsRegisteringReady(true);
      }
    }
  }
  async RequestFireBase() {
    const permission =
      typeof Notification !== "undefined"
        ? await Notification.requestPermission()
        : null;

    if (permission !== "granted") {
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
            await fetchData({
              url: "/firebase_device_tokens",
              body: JSON.stringify({
                device_token: token,
                user_id: auth.UserID(),
                auth_token: auth.UserToken(),
              }),
              reqTitle: "register firebase token",
              method: "POST",
              server: "market",
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
    const marketToken = getCookie(COOKIE_NAMES.MARKET_TOKEN);
    const deviceToken = getCookie(COOKIE_NAMES.DEVICE_TOKEN);
    const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
    const { loginSuccess, loginSuccessChat, loginSuccessStories } =
      useAppStore.getState();
    if (userData) {
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
    await this.RequestFireBase();
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
        setIsRegisteringReady(false);
        let response = await fetchData({
          url: REGISTER_DEVICE_URL,
          body: JSON.stringify(requestBody),
          reqTitle: "register device",
          method: "POST",
          server: "market",
        });

        let repo: RegisterGuestApi = response;
        if (repo.message === "The user does not exist.") {
          response = await fetchData({
            url: REGISTER_DEVICE_URL,
            body: JSON.stringify({ old_guest_user_id: null }),
            reqTitle: "register device for expired user - retry",
            method: "POST",
            server: "market",
          });
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
          if (process.env.NODE_ENV === "production" && Smartlook.initialized())
            Smartlook.identify(repo.data.user.id, {
              name: repo.data.user.name,
              phone: "guest",
              // other custom properties
            });
          await this.RequestFireBase();
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
      let response = await fetchData({
        url: "/firebase_device_tokens/subscribe_topic",
        body: JSON.stringify({
          topic,
          variant,
        }),
        reqTitle: "store firebase subscribe topic",
        method: "POST",
        server: "market",
      });

      getFirebaseSettings(response.data.firebase_settings);
    }
  }
  async UnsubscripeFromTopic({ topic }) {
    const { getFirebaseSettings } = useAppStore.getState();

    let response = await fetchData({
      url: "/firebase_device_tokens/unsubscribe_topic",
      body: JSON.stringify({
        topic,
      }),
      reqTitle: "store firebase unsubscribe topic",
      method: "POST",
      server: "market",
    });
    getFirebaseSettings(response.data.firebase_settings);
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
      let response = await fetchData({
        url: "/firebase_device_tokens/change_country_language",
        body: JSON.stringify({
          country: countryCode,
          language_code: languageCode,
        }),
        reqTitle: "change firebase country-language pair",
        method: "POST",
        server: "market",
      });
      getFirebaseSettings(response?.data?.firebase_settings);
      localStorage.setItem("lastPair", countryCode + languageCode);
    }
  }

  async hideOldCart({ id }: { id?: number }) {
    try {
      await fetchData({
        url: "/old-cart/hide",
        body: JSON.stringify({ id: id }),
        reqTitle: "Hide Old Cart",
        method: "POST",
        server: "market",
      });
    } catch (error) {}
  }

  async TestNotificationBoutique({ boutique_id }) {
    await this.subscribeToTopic({ topic: "boutique_created" });
    await fetchData({
      url: "/firebase_device_tokens/send_boutique_created",
      body: JSON.stringify({
        boutique_id: boutique_id,
        topic: "boutique_created",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send boutique created",
      method: "POST",
      server: "market",
    });
  }

  async TestNotificationProductToOldCart() {
    await fetchData({
      url: "/firebase_device_tokens/send_product_cart_expiration",
      body: JSON.stringify({
        product_id: 7681,
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send product cart expiration",
      method: "POST",
      server: "market",
    });
  }

  async TestNotificationProductAvailable() {
    await this.subscribeToTopic({
      topic: "product_availability_7681",
      variant: "Blue-XXL",
    });

    await fetchData({
      url: "/firebase_device_tokens/send_product_availability",
      body: JSON.stringify({
        product_id: 7681,
        variant: "Blue-XXL",
        topic: "product_availability_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send product availability",
      method: "POST",
      server: "market",
    });
  }

  async TestNotificationProductComment() {
    await this.subscribeToTopic({ topic: "product_comment_7681" });
    await fetchData({
      url: "/firebase_device_tokens/send_product_comment",
      body: JSON.stringify({
        product_id: 7681,
        topic: "product_comment_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send product comment",
      method: "POST",
      server: "market",
    });
  }

  async TestNotificationProductDiscount() {
    await this.subscribeToTopic({ topic: "product_discount_7681" });

    await fetchData({
      url: "/firebase_device_tokens/send_product_discount",
      body: JSON.stringify({
        product_id: 7681,
        topic: "product_discount_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send product discount",
      method: "POST",
      server: "market",
    });
  }

  async TestNotificationCategoryCreated() {
    await this.subscribeToTopic({ topic: "category_created" });

    await fetchData({
      url: "/firebase_device_tokens/send_category_created",
      body: JSON.stringify({
        category_id: 392,
        topic: "category_created",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send category created",
      method: "POST",
      server: "market",
    });
  }

  //before stock out and change in price
  async TestNotificationBeforeStockOut() {
    await this.subscribeToTopic({ topic: "product_before_stock_out_7681" });

    await fetchData({
      url: "/firebase_device_tokens/send_product_before_stock_out",
      body: JSON.stringify({
        user_id: auth.UserID(),
        product_id: 7681,
        topic: "product_before_stock_out_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send product before stock out",
      method: "POST",
      server: "market",
    });
  }

  async TestNotificationChangeInPrice() {
    await this.subscribeToTopic({ topic: "product_when_change_in_price_7681" });

    await fetchData({
      url: "/firebase_device_tokens/send_product_when_change_in_price",
      body: JSON.stringify({
        user_id: auth.UserID(),
        product_id: 7681,
        topic: "product_when_change_in_price_7681",
        language_code: LocalizationServiceClass.GetAppLanguage(),
        country_iso: LocalizationServiceClass.GetAppCountry(),
      }),
      reqTitle: "send product when change in price",
      method: "POST",
      server: "market",
    });
  }

  async EditNotificationSettings({ url, body }) {
    try {
      await fetchData({
        url: `/firebase_device_tokens/${url}`,
        body: JSON.stringify(body),
        reqTitle: "edit notification settings",
        method: "POST",
        server: "market",
      });
    } catch (error) {}
  }
}

export default new HomeService();
