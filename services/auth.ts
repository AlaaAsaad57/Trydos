import { useAppStore } from "store";
import { smartlookIdentify } from "utils/smartlook";
import { _isStoreLastJson, LogError, translateFunction } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";

import StoryService from "services/story";
import home from "./home";
import { GAevent, SetGAUser } from "utils/gtag";

import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import { COOKIE_NAMES } from "utils/cookies/cookie-manager";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";
import { LogServerError } from "utils/serverErrorReporter";
import { checkWallet } from "./wallet";

// Helper to update user metadata in HttpOnly cookies via server route
async function updateSecureUserData(
  updates: Array<{ name: string; value: unknown }>,
) {
  try {
    await fetch("/api/auth/update-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates }),
      credentials: "include",
    });
  } catch (err) {
    // Non-critical — store state is the source of truth for client
  }
}

let _expirePromise: Promise<void> | null = null;

class AuthService {
  async SendOtp(
    mobilePhone: string,
    is_via_whatsapp: number | string,

    errorCallback: Function,
  ) {
    let msg = "";
    const { setVerificationId, setWrongNumber } = useAppStore.getState();
    try {
      let response = await fetchData({
        url:
          SEND_OTP +
          `?phone=+${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.SEND_OTP,
      });

      msg = response.message;
      if (!response.success) {
        throw new Error(response.message);
      }
      if (response.data?.verificationId) {
        setVerificationId(response.data.verificationId);
        return response.data.verificationId;
      } else {
        setWrongNumber(msg);
        throw new Error(msg);
      }
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In SendOtp in services/auth",
      });
      errorCallback();
      setWrongNumber(msg);

      throw e;
    }
  }
  async VerifyOtp(
    code: string,
    verficationID: string,
    Username: string,
    EditPhoneFunc: Function,
  ) {
    const { userProfile } = useAppStore.getState();
    let old_geust_id = userProfile?.id;
    const {
      setTempUser,
      setWrongNumber,
      loginFailed,
      loginSuccess,
      loginSuccessChat,
      loginSuccessStories,
      setReAuthResult,
      setShouldAuthinticated,
    } = useAppStore.getState();
    try {
      let response = await fetchData({
        url:
          "/api/auth/login" +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        method: "GET",
        server: "local",
        reqTitle: REQUESTS_DATA.VERIFY_OTP_FROM_GUEST,
      });

      if (response.code === 501 && !response.success) {
        showErrorNotification(response?.message);
        throw new Error("Wrong Code", response?.message);
      }
      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }
      if (response?.isSuccessful === false && !response.success) {
        throw new Error("Wrong Code", response?.message);
      }
      if (response?.is_failed) {
        LogError({
          source: "login server api",
          userId: response.data?.user?.id,
          error: response.is_failed,
          page: window.location.href,
          url: "/auth/login",
          method: "POST",
          body: response.is_failed,
        });
      }

      // Tokens are now set as HttpOnly cookies by the server route.
      // Only store non-sensitive user data in Zustand.
      checkWallet({
        id: response?.WalletUser?.id,
        handleUnauthenticated: () => {},
      });

      const user = response.data.user;
      if (old_geust_id !== user.id) {
        GAevent({
          action: GA_EVENT_NAMES.CUSTOM_USER_MAPPING,
          params: {
            user_id_guest: old_geust_id,
            user_id_verify: user.id,
          },
        });
      }
      localStorage.removeItem("FBID");
      SetGAUser(user, !response.data.already_exists);
      setTempUser({
        ...user,
        already_exists: response.data.already_exists,
        is_verified: false,
      });

      let userChat = { ...response.ChatUser, need_auth: false };
      let userStories = { ...response.StoriesUser, need_auth: false };

      localStorage.setItem("LAST-VERIFY", new Date().toISOString());
      loginSuccess({
        id: user.id,
        idToken: user.id_token,
        name: user.name,
        image: user,
        already_exists: response.data.already_exists,
        is_verified: 1,
        is_phone_verified: 1,
      });
      loginSuccessChat({
        ...userChat,
        is_verified: 1,
        is_phone_verified: 1,
      });
      loginSuccessStories({
        ...userStories,
        is_verified: 1,
        is_phone_verified: 1,
      });

      // Signal re-auth completed (used by handleUnauthorized polling)
      setReAuthResult("success");
      setShouldAuthinticated(false);
      if (user) {
        smartlookIdentify(user.id, {
          name: user.name,
          phone: user.mobilePhone,
        });
      }
      try {
        home.getNotificationPermissionStatus();
        home.getClientData();
        if (window.location.pathname.includes("/seller")) {
          window.location.reload();
        }
        await this.CheckUserName();
      } catch (error) {}
      return [response.data.already_exists, user.name];
    } catch (e) {
      if (e.message === "user not found") {
        setWrongNumber("user not found");
      } else {
        loginFailed();
      }
      LogServerError({
        error: e,
        scenario: "Error In VerifyOtp in services/auth",
      });
      throw e;
    }
  }
  async VerifyOtpForUpdatePhone(code: string, verficationID: string) {
    const { updateUserIsVerified, setWrongNumber } = useAppStore.getState();
    try {
      let response = await fetchData({
        url:
          "/auth/phone/verify_otp" +
          `?verificationId=${verficationID}&otp=${code}`,
        method: "GET",
        server: "market",
        reqTitle: REQUESTS_DATA.VERIFY_OTP,
      });

      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }
      if (response?.isSuccessful === false && !response.success) {
        throw new Error("Wrong Code", response?.message);
      }
      localStorage.setItem("ID-TOKEN", response.data.id_token);
      updateUserIsVerified({ is_phone_verified: 1 });
      return response.data.id_token;
    } catch (error) {
      setWrongNumber(error.message);
      LogServerError({
        error: error,
        scenario: "Error In VerifyOtpForUpdatePhone in services/auth",
      });
      throw error;
    }
  }
  async UpdateName(name: string) {
    const { updateName, userChat, userStories, userProfile } =
      useAppStore.getState();
    try {
      // Update store immediately for responsive UI
      updateName(name);

      // Update server-side HttpOnly cookies
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: { name } },
        { name: COOKIE_NAMES.USER_CHAT, value: { name } },
        { name: COOKIE_NAMES.USER_STORIES, value: { name } },
      ]);

      let res = await fetchData({
        url: "/customer/update-name",
        body: JSON.stringify({ name }),
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_MARKET,
        method: "POST",
        server: "market",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      let chat_update = await fetchData({
        url: `/api/v1/users/${this.UserID()}`,
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_CHAT,
        method: "PUT",
        server: "chat",
        body: JSON.stringify({ name }),
      });
      if (!chat_update.success) {
        throw new Error(chat_update.message);
      }
      await home.getCustomerInfo();
      let response = await fetchData({
        url: "/api/v1/users/update",
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
        method: "POST",
        server: "stories",
        body: JSON.stringify({ name }),
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      StoryService.getStories();
    } catch (e) {
      LogServerError({
        error: e,
        scenario: "Error In UpdateName in services/auth",
      });
    }
  }

  async cancelAuth(isForExpired?) {
    const { userProfile } = useAppStore.getState();
    if (!userProfile) {
      home.registerForExpire();
    }

    const { cancelAuth } = useAppStore.getState();
    cancelAuth(isForExpired);
  }
  async NotifyForProducts({ id, variant }) {
    if (!variant || variant?.includes("N/A"))
      await home.subscribeToTopic({
        topic: `product_availability_${id}`,
      });
    else
      await home.subscribeToTopic({
        topic: `product_availability_${id}`,
        variant: variant,
      });
  }

  getUser() {
    return useAppStore.getState().userProfile;
  }
  async validateFCMToken() {
    if (!localStorage.getItem("FBID")) return;
    try {
      let res = await fetchData({
        server: "market",
        url: "/firebase_device_tokens/validate_token",
        method: "POST",
        body: JSON.stringify({
          firebase_token_id: localStorage.getItem("FBID"),
        }),
        reqTitle: REQUESTS_DATA.VALIDATE_FCM_TOKEN,
        noMessage: true,
      });
      return res;
    } catch (error) {
      console.log(error);
    }
  }
  UserID() {
    return (
      useAppStore.getState().userProfile?.id || useAppStore.getState().user?.id
    );
  }
  User() {
    return useAppStore.getState().userProfile || useAppStore.getState().user;
  }
  ConfigurePhoto(imageVar, serverVar) {
    if (serverVar === "market") {
      if (imageVar?.includes("customers")) {
        return imageVar.replace("/customers/profile/", "");
      } else {
        return imageVar;
      }
    } else {
      if (imageVar?.includes("customers")) {
        return imageVar;
      } else {
        if (imageVar) return "/customers/profile/" + imageVar;
        else return null;
      }
    }
  }
  async ExpiredUser(noReq = false) {
    const { LoggingOut } = useAppStore.getState();
    if (LoggingOut) return;

    // Deduplicate concurrent 401 handlers — reuse in-flight expire
    if (_expirePromise) return _expirePromise;

    _expirePromise = this._doExpire(noReq);
    try {
      await _expirePromise;
    } finally {
      _expirePromise = null;
    }
  }

  private async _doExpire(noReq: boolean) {
    const { setReAuthResult, setIsRegisteringReady } = useAppStore.getState();

    setIsRegisteringReady(false);

    try {
      if (!noReq) {
        const { country, language } = this._getLocale();
        await fetch("/api/auth/expire", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-country": country,
            "x-language": language,
          },
          body: JSON.stringify({ old_user_id: this.UserID() }),
          credentials: "include",
        });
      }

      this.cancelAuth(true);
      setReAuthResult("cancelled");
    } finally {
      setIsRegisteringReady(true);
    }
  }

  _getLocale() {
    const [country, lang] = (
      window.location.pathname.split("/")[1] || ""
    ).split("-");
    return { country: country || "sy", language: lang || "en" };
  }
  async UpdateProfile(userObj, previousUserObj) {
    const {
      userProfile,
      userChat,
      userStories,
      editUserInfo,
      loginSuccessChat,
      loginSuccessStories,
    } = useAppStore.getState();
    let market_done = false,
      chat_done = false,
      stories_done = false;

    try {
      if (userStories?.id) {
        let res = await fetchData({
          url: "/api/v1/users/update",
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
          method: "POST",
          server: "stories",
          body: JSON.stringify({
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "story"),
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        stories_done = true;
        const storiesUpdate = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userObj?.image, "story"),
        };
        loginSuccessStories(storiesUpdate);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_STORIES, value: storiesUpdate },
        ]);
      }
      if (userChat?.id) {
        let chat_update = await fetchData({
          url: `/api/v1/users/${this.UserID()}`,
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_CHAT,
          method: "PUT",
          server: "chat",
          body: JSON.stringify({
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
          }),
        });
        if (!chat_update.success) {
          throw new Error(chat_update.message);
        }
        chat_done = true;
        const chatUpdate = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
        };
        loginSuccessChat(chatUpdate);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_CHAT, value: chatUpdate },
        ]);
      }
      let res = await fetchData({
        url: "/customer/update-profile",
        body: JSON.stringify({
          ...userObj,
          image: this.ConfigurePhoto(userObj?.image, "market"),
        }),
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
        method: "POST",
        server: "market",
      });
      if (!res.success) {
        throw new Error(res.message);
      }
      market_done = true;
      const marketUpdate = {
        weight: userObj?.weight ?? userProfile?.weight,
        tall: userObj?.tall ?? userProfile?.tall,
        name: userObj?.name ?? userProfile?.name,
        phone: userObj?.phone ?? userProfile?.phone,
        image: this.getImageForCookie(userObj?.image),
      };
      editUserInfo(marketUpdate);
      updateSecureUserData([
        { name: COOKIE_NAMES.USER_DATA, value: marketUpdate },
      ]);

      await new Promise((resolve) => setTimeout(resolve, 1500));
      return res;
    } catch (error) {
      LogServerError({
        error: error,
        scenario: "Error In UpdateProfile in services/auth",
      });
      if (market_done) {
        let res = await fetchData({
          url: "/customer/update-profile",
          body: userProfile,
          reqTitle: REQUESTS_DATA.UPDATE_PROFILE,
          method: "POST",
          server: "market",
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        const revertMarket = {
          name: userObj?.name ?? userProfile?.name,
          phone: userObj?.phone ?? userProfile?.phone,
          image: this.getImageForCookie(userProfile?.image),
        };
        editUserInfo(revertMarket);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_DATA, value: revertMarket },
        ]);
      }
      if (stories_done) {
        let res = await fetchData({
          url: "/api/v1/users/update",
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
          method: "POST",
          server: "stories",
          body: JSON.stringify({
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        const revertStories = {
          name: userProfile?.name,
          mobile_phone: userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "story"),
        };
        loginSuccessStories(revertStories);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_STORIES, value: revertStories },
        ]);
      }
      if (chat_done) {
        let res = await fetchData({
          url: `/api/v1/users/${this.UserID()}`,
          reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_CHAT,
          method: "PUT",
          server: "chat",
          body: JSON.stringify({
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }),
        });
        if (!res.success) {
          throw new Error(res.message);
        }
        const revertChat = {
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "chat"),
        };
        loginSuccessChat(revertChat);
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_CHAT, value: revertChat },
        ]);
      }
      showErrorNotification(translateFunction("Failed to update profile Info"));
      throw error;
    }
  }
  getImageForCookie(image) {
    if (!image?.includes("customers") && image?.length) {
      return "/customers/profile/" + image;
    } else {
      return image;
    }
  }
  async UpdateProfileImage(image) {
    let formData = new FormData();
    formData.append("image", image);
    formData.append("path", "customers/profile");

    try {
      let response = await fetchData({
        url: "/storage/storage-upload",
        body: formData,
        reqTitle: REQUESTS_DATA.UPDATE_PROFILE_IMAGE,
        method: "POST",
        server: "market",
      });
      // @ts-ignore
      if (!response.success) {
        throw new Error(response.message);
      }
      return response.data;
    } catch (err) {
      LogServerError({
        error: err,
        scenario: "Error In UpdateProfileImage in services/auth",
      });
      return null;
    }
  }
  async CheckUserName() {
    const { userChat, userStories, userProfile } = useAppStore.getState();
    let username_stories = userStories?.name;
    let username_chat = userChat?.name;
    let username_market = userProfile?.name;
    if (userProfile?.name === "verified_guest") return null;
    if (Boolean(userChat) && Boolean(userStories))
      if (
        username_chat !== username_market ||
        username_stories !== username_market
      ) {
        // Update store and server-side cookies
        const { loginSuccessChat, loginSuccessStories } =
          useAppStore.getState();
        loginSuccessChat({ name: username_market });
        loginSuccessStories({ name: username_market });
        updateSecureUserData([
          { name: COOKIE_NAMES.USER_CHAT, value: { name: username_market } },
          { name: COOKIE_NAMES.USER_STORIES, value: { name: username_market } },
        ]);
        try {
          await this.UpdateProfile(
            { name: username_market },
            { name: username_market },
          );
        } catch (error) {
          LogServerError({
            error: error,
            scenario: "Error In CheckUserName in services/auth",
          });
        }
      }
  }
}
export default new AuthService();
