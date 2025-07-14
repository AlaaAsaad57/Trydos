import { useAppStore } from "store";
import Smartlook from "smartlook-client";
import { _isStoreLastJson, translateFunction } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
import home from "./home";
import { changeToken } from "store/homepage/cachedActions";
import { GAevent, SetGAUser } from "utils/gtag";

import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
import {
  COOKIE_NAMES,
  deleteCookie,
  getCookie,
  setCookie,
  UserData,
} from "utils/cookies/cookie-manager";
import { GA_EVENT_NAMES } from "utils/GAEvents";

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
        reqTitle: "Send OTP",
      });

      msg = response.message;

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
        reqTitle: "Verify OTP",
      });

      if (response.code === 501) {
        showErrorNotification(response?.message);
        throw new Error("Wrong Code");
      }
      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }

      if (response?.isSuccessful === false) {
        throw new Error("Wrong Code");
      }
      localStorage.setItem("ID-TOKEN", response.data.id_token);
      setCookie(COOKIE_NAMES.MARKET_TOKEN, response.data.token);
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
        reqTitle: "Verify OTP",
      });

      if (response?.data?.message === "user not found") {
        throw new Error("user not found");
      }

      if (response?.isSuccessful === false) {
        throw new Error("Wrong Code");
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
      await fetchData({
        url: "/customer/update-name",
        body: JSON.stringify({ name: name }),
        reqTitle: "Update Name in market",
        method: "POST",
        server: "market",
      });
      let chat_update = await fetchData({
        url: `/api/v1/users/${this.UserID()}`,
        reqTitle: "Update Name in chat",
        method: "PUT",
        server: "chat",
        body: JSON.stringify({ name: name }),
      });
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
      await fetchData({
        url: "/api/v1/users/update",
        reqTitle: "Update Name in stories",
        method: "POST",
        server: "stories",
        body: JSON.stringify({ name: name }),
      });

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
    if (this.getUser()?.phone?.length > 2)
      localStorage.setItem("has-phone", this.getUser()?.phone);
    if (!noReq) await home.registerForExpire(this.UserID());
    this.cancelAuth(true);
    deleteCookie(COOKIE_NAMES.MARKET_TOKEN);
    deleteCookie(COOKIE_NAMES.USER_CHAT);
    deleteCookie(COOKIE_NAMES.USER_STORIES);
    deleteCookie(COOKIE_NAMES.CHAT_TOKEN);
    deleteCookie(COOKIE_NAMES.STORIES_TOKEN);
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
          reqTitle: "Update Name in stories",
          method: "POST",
          server: "stories",
          body: JSON.stringify({
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "story"),
          }),
        });
        console.log(res);
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
          reqTitle: "Update Name in chat",
          method: "PUT",
          server: "chat",
          body: JSON.stringify({
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
          }),
        });
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
        reqTitle: "Update Profile",
        method: "POST",
        server: "market",
      });
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
        await fetchData({
          url: "/customer/update-profile",
          body: userProfile,
          reqTitle: "Update Profile",
          method: "POST",
          server: "market",
        });
        market_done = true;
        setCookie(COOKIE_NAMES.USER_DATA, {
          ...user,
          name: userObj?.name ?? userProfile?.name,
          phone: userObj?.phone ?? userProfile?.phone,
          image: this.getImageForCookie(userProfile?.image),
        });
      }
      if (stories_done) {
        await fetchData({
          url: "/api/v1/users/update",
          reqTitle: "Update Name in stories",
          method: "POST",
          server: "stories",
          body: JSON.stringify({
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }),
        });
        setCookie(COOKIE_NAMES.USER_STORIES, {
          ...userStories,
          name: userProfile?.name,
          mobile_phone: userProfile?.phone,
          photo_path: this.ConfigurePhoto(userProfile?.image, "story"),
        });
      }
      if (chat_done) {
        await fetchData({
          url: `/api/v1/users/${this.UserID()}`,
          reqTitle: "Update Name in chat",
          method: "PUT",
          server: "chat",
          body: JSON.stringify({
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }),
        });
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

    let response = await fetchData({
      url: "/storage/storage-upload",
      body: formData,
      reqTitle: "Update Profile Image",
      method: "POST",
      server: "market",
    });
    return response.data;
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
