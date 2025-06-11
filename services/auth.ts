import { useAppStore } from "store";

import userImage from "public/images/profileNo.png";
import Cookies from "js-cookie";
import Smartlook from "smartlook-client";

import { _isStoreLastJson, getLang } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
import home from "./home";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { ProductSocialInfo } from "models/API/market/ProductSocialInfo";
import { changeToken } from "store/homepage/cachedActions";
import axios from "axios";
import { SetGAUser } from "utils/gtag";
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
      let response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          SEND_OTP +
          `?phone=+${mobilePhone}&is_via_whatsapp=${is_via_whatsapp}`,
        getHeader()
      );

      let repo: {
        message: string;
        data: {
          verificationId: string;
        };
      } = await response.json();

      msg = repo.message;

      if (repo.data?.verificationId) {
        setVerificationId(repo.data.verificationId);
        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
        return repo.data.verificationId;
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
      let response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/auth/phone/verify_otp_from_guest" +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        getHeader()
      );
      if (response.status === 401) {
        await home.registerForExpire();
        response = await fetch(
          process.env.NEXT_PUBLIC_BACKEND_URL +
            "/auth/phone/verify_otp_from_guest" +
            `?verificationId=${verficationID}&otp=${code}${
              Username.length > 0 ? `&name=${Username}` : ""
            }`,
          getHeader()
        );
      }

      let repo: {
        data: {
          already_exists: boolean;
          message: string;
          Logged_in_from_another_device: boolean;
          id_token: string;
          user_type: number;
          token: string;
          expires_at: string;
          user: {
            id: number;
            name: string;
            phone: string;
            is_phone_verified: number;
            last_otp_id_token: string;
          };
        };
        isSuccessful: boolean;
      } = await response.json();
      console.log(repo);
      if (repo?.data?.message === "user not found") {
        throw new Error("user not found");
      }

      if (repo?.isSuccessful === false) {
        throw new Error("Wrong Code");
      }
      localStorage.setItem("ID-TOKEN", repo.data.id_token);
      Cookies.set("MARKET-TOKEN", repo.data.token);
      localStorage.setItem("MARKET-TOKEN", repo.data.token);
      changeToken({ key: "MARKET-TOKEN", value: repo.data.token });
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...repo.data.user,
          already_exists: repo.data.already_exists,
          is_verified: false,
          expires_at: repo.data.expires_at,
        })
      );
      SetGAUser(repo.data.user);
      localStorage.removeItem("guest-user");
      if (localStorage.getItem("customer-info")) {
        localStorage.removeItem("customer-info");
      }
      setTempUser({
        ...repo.data.user,
        already_exists: repo.data.already_exists,
        is_verified: false,
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
      setTimeout(() => {
        home.getClientData();
      }, 2000);
      return [repo.data.already_exists, repo.data.user.name];
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
      let response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/auth/phone/verify_otp" +
          `?verificationId=${verficationID}&otp=${code}`,
        getHeader()
      );

      let data = await response.json();
      if (data?.data?.message === "user not found") {
        throw new Error("user not found");
      }

      if (data?.isSuccessful === false) {
        throw new Error("Wrong Code");
      }
      localStorage.setItem("ID-TOKEN", data.data.id_token);
      updateUserIsVerified({ is_phone_verified: 1 });
      return data.data.id_token;
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
      SetGAUser({
        ...JSON.parse(localStorage.getItem("USER")),
        name: name,
      });
      updateName(name);
      let axios = (await import("axios")).default;
      await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/update-name",
        body: { name: name },
        title: "Update Name",
      });
      let chat_update = await axios.put(
        process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
          `/api/v1/users/${this.UserID()}`,
        { name: name },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("CHAT-TOKEN")}`,
          },
        }
      );
      localStorage.setItem(
        "USER-CHAT",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("USER-STORIES")),
          name: name,
        })
      );
      await home.getCustomerInfo();
      if (!localStorage.getItem("STORIES-TOKEN")) {
        await this.ConfirmSignIn();
      }
      await axios.post(
        process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + "/api/v1/users/update",
        { name: name },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("STORIES-TOKEN")}`,
          },
        }
      );

      StoryService.getStories();
    } catch (e) {
      console.error(e);
    }
  }
  async ConfirmSignIn() {
    let userLocal = JSON.parse(localStorage.getItem("USER"));
    const { loginSuccess } = useAppStore.getState();
    if (userLocal) {
      if (Smartlook.initialized())
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
    SetGAUser({ ...userLocal, is_verified: true });
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
    // const details = {
    //   product_id: id,
    //   variant,
    //   user_id: UserID(),
    //   notification_type_id: 1,
    // };
    // var formBody: any = [];
    // for (var property in details) {
    //   var encodedKey = encodeURIComponent(property);
    //   var encodedValue = encodeURIComponent(details[property]);
    //   formBody.push(encodedKey + "=" + encodedValue);
    // }
    // formBody = formBody.join("&");
    // await AxiosPost({
    //   url: process.env.NEXT_PUBLIC_BACKEND_URL + "/product_notification/store",
    //   body: formBody,
    //   title: "store Notification For Product",
    // });
    await home.subscribeToTopic({
      topic: `product_availability_${id}`,
      variant: variant,
    });
  }
  async getProductNotify({ id }) {
    try {
      if (!localStorage.getItem("DEVICE-TOKEN")) await home.RegisterDevice();
      let data: ProductSocialInfo = await AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/web/product/likesCommentsSharesDetails/" +
          id,
        title: "Get Notify Data for product",
      });

      return data;
    } catch (error) {}
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
  async ExpiredUser() {
    if (this.getUser()?.phone)
      localStorage.setItem("has-phone", this.getUser()?.phone);
    await home.registerForExpire(this.UserID());
    this.cancelAuth();
    localStorage.removeItem("MARKET-TOKEN");
    localStorage.removeItem("USER");
    Cookies.remove("MARKET-TOKEN");
  }
  async UpdateProfile(userObj, previousUserObj) {
    const { userProfile } = useAppStore.getState();
    let market_done = false,
      chat_done = false,
      stories_done = false;

    try {
      if (localStorage.getItem("USER-STORIES")) {
        await axios
          .post(
            process.env.NEXT_PUBLIC_STORIES_BACKEND_URL +
              "/api/v1/users/update",
            {
              name: userObj?.name ?? userProfile?.name,
              mobile_phone: userObj?.phone ?? userProfile?.phone,
              photo_path: userObj?.image ?? userProfile?.image,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem(
                  "STORIES-TOKEN"
                )}`,
              },
            }
          )
          .then((s) => {
            stories_done = true;
          });
        localStorage.setItem(
          "USER-STORIES",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("USER-STORIES")),
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: userObj?.image ?? userProfile?.image,
          })
        );
      }
      // let user_id = JSON.parse(localStorage.getItem("USER-CHAT")).id;
      if (localStorage.getItem("USER-CHAT")) {
        let chat_update = await axios
          .put(
            process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
              `/api/v1/users/${this.UserID()}`,
            {
              name: userObj?.name ?? userProfile?.name,
              mobile_phone: userObj?.phone ?? userProfile?.phone,
              photo_path: userObj?.image ?? userProfile?.image,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("CHAT-TOKEN")}`,
              },
            }
          )
          .then((s) => {
            chat_done = true;
          });
        localStorage.setItem(
          "USER-CHAT",
          JSON.stringify({
            ...JSON.parse(localStorage.getItem("USER-CHAT")),
            name: userObj?.name ?? userProfile?.name,
            mobile_phone: userObj?.phone ?? userProfile?.phone,
            photo_path: userObj?.image ?? userProfile?.image,
          })
        );
      }
      let res = await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/update-profile",
        body: userObj,
        title: "Update Profile",
      }).then((s) => {
        market_done = true;
      });
      localStorage.setItem(
        "USER",
        JSON.stringify({
          ...JSON.parse(localStorage.getItem("USER")),
          name: userObj?.name ?? userProfile?.name,
          phone: userObj?.phone ?? userProfile?.phone,
          image: userObj?.image ?? userProfile?.image,
        })
      );
      SetGAUser({
        ...JSON.parse(localStorage.getItem("USER")),
        name: userObj?.name ?? userProfile?.name,
        phone: userObj?.phone ?? userProfile?.phone,
        image: userObj?.image ?? userProfile?.image,
      });
      return res;
    } catch (error) {
      if (market_done) {
        await AxiosPost({
          url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/update-profile",
          body: userProfile,
          title: "Update Profile",
        }).then((s) => {
          market_done = true;
        });
      }
      if (stories_done) {
        await axios.post(
          process.env.NEXT_PUBLIC_STORIES_BACKEND_URL + "/api/v1/users/update",
          {
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("STORIES-TOKEN")}`,
            },
          }
        );
      }
      if (chat_done) {
        await axios.put(
          process.env.NEXT_PUBLIC_CHAT_BACKEND_URL +
            `/api/v1/users/${this.UserID()}`,
          {
            name: userProfile?.name,
            mobile_phone: userProfile?.phone,
            photo_path: userProfile?.image,
          }
        );
      }
      throw error;
    }
  }
  async UpdateProfileImage(image) {
    let formData = new FormData();
    formData.append("image", image);
    formData.append("path", "customers/profile");

    let res = await AxiosPost({
      url: process.env.NEXT_PUBLIC_BACKEND_URL + "/storage/storage-upload",
      body: formData,
      title: "Update Profile Image",
    });
    return res;
  }
  async CheckUserName() {
    let isChatUserExist = JSON.parse(localStorage.getItem("USER-CHAT"));
    let isStoriesUserExist = JSON.parse(localStorage.getItem("USER-STORIES"));
    let username_stories = JSON.parse(
      localStorage.getItem("USER-STORIES")
    )?.name;
    let username_chat = JSON.parse(localStorage.getItem("USER-CHAT"))?.name;
    let username_market = JSON.parse(localStorage.getItem("USER-CHAT"))?.name;
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
            ...isChatUserExist,
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
