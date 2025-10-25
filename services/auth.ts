import { useAppStore } from "store";
import Smartlook from "smartlook-client";
import { _isStoreLastJson, translateFunction } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
import home from "./home";
import { GAevent, SetGAUser } from "utils/gtag";

import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import {
  COOKIE_NAMES,
  deleteCookie,
  getCookie,
  setCookie,
  UserData,
  storeHashedUserId,
} from "utils/cookies/cookie-manager";
import { GA_EVENT_NAMES } from "utils/GAEvents";
import { REQUESTS_DATA } from "utils/Requests";

class AuthService {
  async SendOtp(
    mobilePhone: string,
    is_via_whatsapp: number | string,

    errorCallback: Function
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
      errorCallback();
      setWrongNumber(msg);

      throw e;
    }
  }
  async VerifyOtp(
    code: string,
    verficationID: string,
    Username: string,
    EditPhoneFunc: Function
  ) {
    const userData = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    let old_geust_id = userData?.id;
    const { setTempUser, setWrongNumber, loginFailed } = useAppStore.getState();
    try {
      let response = await fetchData({
        url:
          "/auth/phone/verify_otp_from_guest" +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        method: "GET",
        server: "market",
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
      localStorage.setItem("ID-TOKEN", response.data.id_token);
      setCookie(COOKIE_NAMES.MARKET_TOKEN, response.data.token);
      // Store user_id as hashed

      let token_response = await fetchData({
        url: `/public_comment/auth/exchange_token`,
        method: "POST",
        body: JSON.stringify({
          user_id: String(response.data.user.id),
          phone: String(response.data.user.phone),
          id_token: response.data.id_token,
        }),
        reqTitle: {
          reqTitle: "GET Token for User from comments server",
          code: 999,
        },
        server: "comments",
      });
      console.log(token_response);
      if (token_response.comments_token)
        storeHashedUserId(token_response?.comments_token);
      setCookie(COOKIE_NAMES.USER_DATA, {
        ...response.data.user,
        already_exists: response.data.already_exists,
        is_verified: false,
        expires_at: response.data.expires_at,
      });
      if (old_geust_id !== response.data.user.id) {
        GAevent({
          action: GA_EVENT_NAMES.CUSTOM_USER_MAPPING,
          params: {
            user_id_guest: old_geust_id,
            user_id_verify: response.data.user.id,
          },
        });
      }
      SetGAUser(response.data.user, !response.data.already_exists);
      setTempUser({
        ...response.data.user,
        already_exists: response.data.already_exists,
        is_verified: false,
      });

      setTimeout(() => {
        home.getClientData();
      }, 2000);
      return [response.data.already_exists, response.data.user.name];
    } catch (e) {
      if (e.message === "user not found") {
        setWrongNumber("user not found");
      } else {
        loginFailed();
      }
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
      throw error;
    }
  }
  async UpdateName(name: string) {
    const { updateName } = useAppStore.getState();
    const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
    const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    try {
      setCookie(COOKIE_NAMES.USER_STORIES, {
        ...userStories,
        name: name,
      });
      setCookie(COOKIE_NAMES.USER_DATA, {
        ...user,
        name: name,
      });
      setCookie(COOKIE_NAMES.USER_DATA, {
        ...user,
        name: name,
      });
      updateName(name);
      let res = await fetchData({
        url: "/customer/update-name",
        body: JSON.stringify({ name: name }),
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
        body: JSON.stringify({ name: name }),
      });
      if (!chat_update.success) {
        throw new Error(chat_update.message);
      }
      setCookie(COOKIE_NAMES.USER_CHAT, {
        ...userChat,
        name: name,
      });
      setCookie(COOKIE_NAMES.USER_STORIES, {
        ...userStories,
        name: name,
      });
      await home.getCustomerInfo();
      if (!userStories) {
        await this.ConfirmSignIn();
      }
      let response = await fetchData({
        url: "/api/v1/users/update",
        reqTitle: REQUESTS_DATA.UPDATE_NAME_IN_STORIES,
        method: "POST",
        server: "stories",
        body: JSON.stringify({ name: name }),
      });
      if (!response.success) {
        throw new Error(response.message);
      }
      StoryService.getStories();
    } catch (e) {
      console.error(e);
    }
  }
  async ConfirmSignIn() {
    let userLocal = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    let userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    let userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
    const { loginSuccess, loginSuccessChat, loginSuccessStories } =
      useAppStore.getState();
    if (userLocal) {
      if (process.env.NODE_ENV === "production" && Smartlook.initialized())
        Smartlook.identify(userLocal.id, {
          name: userLocal.name,
          phone: userLocal.mobilePhone,
          // other custom properties
        });
    }
    loginSuccess({
      id: userLocal.id,
      idToken: userLocal.id_token,
      name: userLocal.name,
      image: userLocal,
      already_exists: userLocal.already_exists,
      is_verified: 1,
      is_phone_verified: 1,
    });
    if (userChat) {
      loginSuccessChat({
        ...userChat,
        is_verified: 1,
        is_phone_verified: 1,
      });
    }
    if (userStories) {
      loginSuccessStories({
        ...userStories,
        is_verified: 1,
        is_phone_verified: 1,
      });
    }
    setCookie(COOKIE_NAMES.USER_DATA, {
      ...userLocal,
      is_verified: 1,
      is_phone_verified: 1,
    });
    await StoryService.loginStories();
    await ChatService.loginChat();
    await this.CheckUserName();
  }
  async cancelAuth(isForExpired?) {
    const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    if (!user) {
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
    return getCookie<UserData>(COOKIE_NAMES.USER_DATA);
  }
  UserToken() {
    return (
      getCookie(COOKIE_NAMES.MARKET_TOKEN) ||
      getCookie(COOKIE_NAMES.DEVICE_TOKEN)
    );
  }
  UserID() {
    return getCookie<UserData>(COOKIE_NAMES.USER_DATA)?.id;
  }
  User() {
    return getCookie<UserData>(COOKIE_NAMES.USER_DATA);
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
    let userChat: any = getCookie(COOKIE_NAMES.USER_CHAT);
    let userStories: any = getCookie(COOKIE_NAMES.USER_STORIES);
    if (!noReq) await home.registerForExpire(this.UserID());
    this.cancelAuth(true);
    deleteCookie(COOKIE_NAMES.MARKET_TOKEN);
    if (userChat?.id)
      setCookie(COOKIE_NAMES.USER_CHAT, {
        ...userChat,
        need_auth: true,
      });
    if (userStories?.id)
      setCookie(COOKIE_NAMES.USER_STORIES, {
        ...userStories,
        need_auth: true,
      });

    deleteCookie(COOKIE_NAMES.CHAT_TOKEN);
    deleteCookie(COOKIE_NAMES.STORIES_TOKEN);
    // clearHashedUserId();
  }
  async UpdateProfile(userObj, previousUserObj) {
    const { userProfile } = useAppStore.getState();
    const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
    const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    let market_done = false,
      chat_done = false,
      stories_done = false;

    try {
      if (userStories && user && userStories?.id) {
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
        setCookie(COOKIE_NAMES.USER_STORIES, {
          ...userStories,
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userObj?.image, "story"),
        });
      }
      if (userChat && user && userChat?.id) {
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
        setCookie(COOKIE_NAMES.USER_CHAT, {
          ...userChat,
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
        });
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
      setCookie(COOKIE_NAMES.USER_DATA, {
        ...user,
        name: userObj?.name ?? userProfile?.name,
        phone: userObj?.phone ?? userProfile?.phone,
        image: this.getImageForCookie(userObj?.image),
      });

      return res;
    } catch (error) {
      console.log(error);
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
        market_done = true;
        setCookie(COOKIE_NAMES.USER_DATA, {
          ...user,
          name: userObj?.name ?? userProfile?.name,
          phone: userObj?.phone ?? userProfile?.phone,
          image: this.getImageForCookie(userProfile?.image),
        });
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
        setCookie(COOKIE_NAMES.USER_STORIES, {
          ...userStories,
          name: userProfile?.name,
          mobile_phone: userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "story"),
        });
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
        setCookie(COOKIE_NAMES.USER_CHAT, {
          ...userChat,
          name: userObj?.name ?? userProfile?.name,
          mobile_phone: userObj?.phone ?? userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "chat"),
        });
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
      console.error(err);
      return null;
    }
  }
  async CheckUserName() {
    const userChat = getCookie<UserData>(COOKIE_NAMES.USER_CHAT);
    const userStories = getCookie<UserData>(COOKIE_NAMES.USER_STORIES);
    const user = getCookie<UserData>(COOKIE_NAMES.USER_DATA);
    let username_stories = userStories?.name;
    let username_chat = userChat?.name;
    let username_market = user?.name;

    if (Boolean(userChat) && Boolean(userStories))
      if (
        username_chat !== username_market ||
        username_stories !== username_market
      ) {
        setCookie(COOKIE_NAMES.USER_CHAT, {
          ...userChat,
          name: username_market,
        });
        setCookie(COOKIE_NAMES.USER_STORIES, {
          ...userStories,
          name: username_market,
        });
        await this.UpdateProfile(
          { name: username_market },
          { name: username_market }
        );
      }
  }
}
export default new AuthService();
