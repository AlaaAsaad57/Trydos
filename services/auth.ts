import { useAppStore } from "store";

import userImage from "public/images/profileNo.png";
import Cookies from "js-cookie";
import Smartlook from "smartlook-client";

import { _isStoreLastJson, getLang, translateFunction } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
import home from "./home";
import { changeToken } from "store/homepage/cachedActions";
import { SetGAUser } from "utils/gtag";

import { showErrorNotification } from "@/store/notifications/reducer";
import { fetchData } from "utils/fetchData";
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
      Cookies.set("MARKET-TOKEN", response.data.token);
      localStorage.setItem("MARKET-TOKEN", response.data.token);
      changeToken({ key: "MARKET-TOKEN", value: response.data.token });
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...response.data.user,
          already_exists: response.data.already_exists,
          is_verified: false,
          expires_at: response.data.expires_at,
        })
      );
      SetGAUser(response.data.user, !response.data.already_exists);
      localStorage.removeItem("guest-user");
      if (localStorage.getItem("customer-info")) {
        localStorage.removeItem("customer-info");
      }
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
      console.log(e);
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
    try {
      localStorage.setItem(
        "USER-STORIES",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("USER-STORIES")),
          name: name,
        })
      );
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("USER")),
          name: name,
        })
      );

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

      localStorage.setItem(
        "USER-CHAT",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("USER-STORIES")),
          name: name,
        })
      );
      await home.getCustomerInfo();
      if (!localStorage.getItem("USER-STORIES")) {
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
    let userLocal = JSON.parse(localStorage.getItem("USER"));
    const { loginSuccess } = useAppStore.getState();
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
      avatar: userImage,
      already_exists: userLocal.already_exists,
      is_verified: true,
    });

    localStorage.setItem(
      "USER",
      JSON.stringify({ ...userLocal, is_verified: true })
    );

    if (localStorage.getItem("guest-user")) {
      localStorage.removeItem("guest-user");
    }
    if (localStorage.getItem("customer-info")) {
      localStorage.removeItem("customer-info");
    }
    await StoryService.loginStories();
    await ChatService.loginChat();
    await this.CheckUserName();
  }
  async cancelAuth() {
    if (!localStorage.getItem("guest-user")) {
      home.registerForExpire();
    }
    const { cancelAuth } = useAppStore.getState();
    cancelAuth();
  }
  async NotifyForProducts({ id, variant }) {
    await home.subscribeToTopic({
      topic: `product_availability_${id}`,
      variant: variant,
    });
  }

  getUser() {
    return (
      (localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER"))) ||
      (localStorage.getItem("guest-user") &&
        JSON.parse(localStorage.getItem("guest-user"))) ||
      false
    );
  }
  UserToken() {
    return (
      localStorage.getItem("MARKET-TOKEN") ||
      localStorage.getItem("DEVICE-TOKEN") ||
      false
    );
  }
  UserID() {
    return (
      (localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER"))?.id) ||
      (localStorage.getItem("guest-user") &&
        JSON.parse(localStorage.getItem("guest-user"))?.id) ||
      false
    );
  }
  User() {
    return (
      (localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER"))) ||
      (localStorage.getItem("guest-user") &&
        JSON.parse(localStorage.getItem("guest-user"))) ||
      false
    );
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
    this.cancelAuth();
    localStorage.removeItem("MARKET-TOKEN");
    localStorage.removeItem("USER");
    localStorage.removeItem("USER-CHAT");
    localStorage.removeItem("USER-STORIES");
    localStorage.removeItem("ID-TOKEN");
    Cookies.remove("MARKET-TOKEN");
  }
  async UpdateProfile(userObj, previousUserObj) {
    const { userProfile } = useAppStore.getState();
    let market_done = false,
      chat_done = false,
      stories_done = false;

    try {
      if (
        localStorage.getItem("USER-STORIES") &&
        localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER-STORIES"))?.id
      ) {
        await fetchData({
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
        stories_done = true;
        localStorage.setItem(
          "USER-STORIES",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("USER-STORIES")),
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "story"),
          })
        );
      }
      // let user_id = JSON.parse(localStorage.getItem("USER-CHAT")).id;
      if (
        localStorage.getItem("USER-CHAT") &&
        localStorage.getItem("USER") &&
        JSON.parse(localStorage.getItem("USER-CHAT"))?.id
      ) {
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
        localStorage.setItem(
          "USER-CHAT",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("USER-CHAT")),
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: this.ConfigurePhoto(userObj?.image, "chat"),
          })
        );
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
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("USER")),
          name: userObj?.name ?? userProfile?.name,
          phone: userObj?.phone ?? userProfile?.phone,
          image: userObj?.image,
        })
      );

      return res;
    } catch (error) {
      if (market_done) {
        await fetchData({
          url: "/customer/update-profile",
          body: userProfile,
          reqTitle: "Update Profile",
          method: "POST",
          server: "market",
        });
        market_done = true;
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
      }
      showErrorNotification(translateFunction("Failed to update profile Info"));
      throw error;
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
    let isChatUserExist = JSON.parse(localStorage.getItem("USER-CHAT"));
    let isStoriesUserExist = JSON.parse(localStorage.getItem("USER-STORIES"));
    let username_stories = JSON.parse(
      localStorage.getItem("USER-STORIES")
    )?.name;
    let username_chat = JSON.parse(localStorage.getItem("USER-CHAT"))?.name;
    let username_market = JSON.parse(localStorage.getItem("USER"))?.name;

    if (Boolean(isChatUserExist) && Boolean(isStoriesUserExist))
      if (
        username_chat !== username_market ||
        username_stories !== username_market
      ) {
        localStorage.setItem(
          "USER-CHAT",
          JSON.stringify({
            ...isChatUserExist,
            name: username_market,
          })
        );
        localStorage.setItem(
          "USER-STORIES",
          JSON.stringify({
            ...isStoriesUserExist,
            name: username_market,
          })
        );
        await this.UpdateProfile(
          { name: username_market },
          { name: username_market }
        );
      }
  }
}
export default new AuthService();
