import { store } from "store";

import userImage from "public/images/profileNo.png";
import Cookies from "js-cookie";
import Smartlook from "smartlook-client";

import { _isStoreLastJson, getLang } from "utils/functions";
import { SEND_OTP } from "utils/endpointConfig";
import ChatService from "services/chat";
import StoryService from "services/story";
import home from "./home";
import { AxiosGet, AxiosPost } from "utils/AxiosApi";
import { LikesSharesCommentsApi } from "models/Api";
import { changeToken } from "store/homepage/cachedActions";
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
        store.dispatch({
          type: "SET-VERFICATION-ID",
          payload: repo.data.verificationId,
        });

        if (typeof window !== "undefined") {
          _isStoreLastJson() &&
            localStorage.setItem("LAST_JSON", JSON.stringify(repo));
        }
      } else {
        store.dispatch({
          type: "WRONG-NUMBER",
          payload: msg,
        });
        throw new Error(msg);
      }
      return repo;
    } catch (e) {
      errorCallback();
      store.dispatch({
        type: "WRONG-NUMBER",
        payload: msg,
      });
      throw e;
    }
  }
  async VerifyOtp(
    code: string,
    verficationID: string,
    Username: string,
    EditPhoneFunc: Function
  ) {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_BACKEND_URL +
          "/auth/phone/verify_otp_from_guest" +
          `?verificationId=${verficationID}&otp=${code}${
            Username.length > 0 ? `&name=${Username}` : ""
          }`,
        getHeader()
      );
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
      localStorage.removeItem("guest-user");
      if (localStorage.getItem("customer-info")) {
        localStorage.removeItem("customer-info");
      }
      store.dispatch({
        type: "TEMP-USER",
        payload: {
          ...repo.data.user,
          already_exists: repo.data.already_exists,
          is_verified: false,
        },
      });
      if (typeof window !== "undefined") {
        localStorage.setItem("LAST_JSON", JSON.stringify(repo));
      }
      setTimeout(() => {
        home.getClientData();
      }, 2000);
      return [repo.data.already_exists, repo.data.user.name];
    } catch (e) {
      if (e.message === "user not found") {
        store.dispatch({ type: "WRONG-NUMBER", payload: "user not found" });
      } else {
        store.dispatch({ type: "LOGIN_FAILED" });
      }
      throw e;
    }
  }

  async UpdateName(name: string) {
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
      store.dispatch({ type: "UPDATE-NAME", payload: name });
      let axios = (await import("axios")).default;
      await AxiosPost({
        url: process.env.NEXT_PUBLIC_BACKEND_URL + "/customer/update-name",
        body: { name: name },
        title: "Update Name",
      });
      if (!localStorage.getItem("STORIES-TOKEN")) {
        await this.ConfirmSignIn();
      }
      axios.post(
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
    if (userLocal) {
      if (Smartlook.initialized())
        Smartlook.identify(userLocal.id, {
          name: userLocal.name,
          phone: userLocal.mobilePhone,
          // other custom properties
        });
    }
    store.dispatch({
      type: "LOGIN_SUCCESS",
      payload: {
        id: userLocal.id,
        idToken: userLocal.id_token,
        name: userLocal.name,
        avatar: userImage,
        already_exists: userLocal.already_exists,
        is_verified: true,
      },
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
  }
  async cancelAuth() {
    if (!localStorage.getItem("guest-user")) {
      home.registerForExpire();
    }
    store.dispatch({ type: "CANCEL-AUTH" });
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
      let data: LikesSharesCommentsApi = await AxiosGet({
        url:
          process.env.NEXT_PUBLIC_BACKEND_URL +
          "/web/product/likesCommentsSharesDetails/" +
          id,
        title: "Get Notify Data for product",
      });

      return data;
    } catch (error) {}
  }
}
export default new AuthService();
